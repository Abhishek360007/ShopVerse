package com.shopverse.services;

import java.math.BigDecimal;
import com.shopverse.dto.OrderItemRequest;
import com.stripe.model.PaymentIntent;
import com.shopverse.auth.dto.OrderResponse;
import com.shopverse.auth.entities.User;
import com.shopverse.dto.OrderDetails;
import com.shopverse.dto.OrderItemDetail;
import com.shopverse.dto.OrderRequest;
import com.shopverse.dto.StatusEventDto;
import com.shopverse.entities.*;
import com.shopverse.repositories.OrderRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.*;

@Service
public class OrderService {

    private static final int DELIVERY_DAYS = 5;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    ProductService productService;

    @Autowired
    PaymentIntentService paymentIntentService;

    @Autowired
    StockService stockService;

    @Autowired
    PaymentConfirmationService paymentConfirmationService;


    /**
     * Places an order. {@code rollbackFor = Exception.class}: creating the Stripe
     * PaymentIntent can throw the checked {@code StripeException}, and by default a
     * transaction commits on checked exceptions, which would keep an unpayable order and
     * the stock it took. Now any failure undoes the order and its stock together.
     */
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrder(OrderRequest orderRequest, Principal principal) throws Exception {
        User user = (User) userDetailsService.loadUserByUsername(principal.getName());
        if (orderRequest.getAddressId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please add a delivery address");
        }
        Address address = user.getAddressList().stream().filter(address1 -> orderRequest.getAddressId().equals(address1.getId())).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery address not found"));

        if (orderRequest.getOrderItemRequests() == null || orderRequest.getOrderItemRequests().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        // Price every line from the catalog; never trust amounts sent by the client
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : orderRequest.getOrderItemRequests()) {
            Product product = productService.fetchProductById(itemRequest.getProductId());
            try {
                total = total.add(OrderPricing.lineTotal(product, itemRequest.getProductVariantId(), itemRequest.getQuantity()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
            orderItems.add(OrderItem.builder()
                    .product(product)
                    .productVariantId(itemRequest.getProductVariantId())
                    .quantity(itemRequest.getQuantity())
                    .itemPrice(product.getPrice())
                    .build());
            // Atomic: fails with 409 if another order took the last units meanwhile
            stockService.take(product, itemRequest.getProductVariantId(), itemRequest.getQuantity());
        }

        Calendar delivery = Calendar.getInstance();
        delivery.add(Calendar.DAY_OF_MONTH, DELIVERY_DAYS);

        Order order= Order.builder()
                .user(user)
                .address(address)
                .totalAmount(total)
                .orderDate(new Date())
                .discount(BigDecimal.ZERO)
                .expectedDeliveryDate(delivery.getTime())
                .paymentMethod("CARD".equals(orderRequest.getPaymentMethod()) ? "CARD" : "COD")
                .orderStatus(OrderStatus.PENDING)
                .build();
        order.changeStatus(OrderStatus.PENDING, "Order placed");
        orderItems.forEach(orderItem -> orderItem.setOrder(order));
        order.setOrderItemList(orderItems);
        Payment payment=new Payment();
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(new Date());
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(order.getPaymentMethod());
        order.setPayment(payment);
        Order savedOrder = orderRepository.save(order);


        OrderResponse orderResponse = OrderResponse.builder()
                .paymentMethod(savedOrder.getPaymentMethod())
                .orderId(savedOrder.getId())
                .build();
        if(Objects.equals(savedOrder.getPaymentMethod(), "CARD")){
            orderResponse.setCredentials(paymentIntentService.createPaymentIntent(order));
        }

        return orderResponse;

    }

    /**
     * The browser reporting that Stripe confirmed the card. The intent is fetched from
     * Stripe here (outside any transaction) so a forged id or status can't mark an order
     * paid; recording it is shared with the webhook and happens at most once.
     */
    public Map<String,String> updateStatus(String paymentIntentId, String status) {
        PaymentIntent paymentIntent;
        try {
            paymentIntent = PaymentIntent.retrieve(paymentIntentId);
        } catch (Exception e) {
            throw new IllegalArgumentException("PaymentIntent not found or missing metadata");
        }
        UUID orderId = paymentConfirmationService.markPaid(paymentIntent)
                .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found or missing metadata"));
        Map<String,String> map = new HashMap<>();
        map.put("orderId", String.valueOf(orderId));
        return map;
    }

    @Transactional
    public List<OrderDetails> getOrdersByUser(String name) {
        User user = (User) userDetailsService.loadUserByUsername(name);
        return orderRepository.findByUser(user).stream()
                .sorted(java.util.Comparator.comparing(Order::getOrderDate,
                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .map(this::toDetails)
                .toList();
    }

    /** Tracking view of one order, for the customer who placed it. */
    @Transactional
    public OrderDetails getOrderForUser(UUID id, String name) {
        User user = (User) userDetailsService.loadUserByUsername(name);
        Order order = orderRepository.findById(id)
                .filter(o -> o.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toDetails(order);
    }

    private OrderDetails toDetails(Order order) {
        return OrderDetails.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .orderStatus(order.getOrderStatus())
                .shipmentNumber(order.getShipmentTrackingNumber())
                .address(order.getAddress())
                .totalAmount(order.getTotalAmount())
                .orderItemList(getItemDetails(order.getOrderItemList()))
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPayment() != null ? order.getPayment().getPaymentStatus() : null)
                .statusHistory(StatusEventDto.historyOf(order.getStatusHistory(), order.getOrderDate(), order.getOrderStatus()))
                .cancellable(OrderStatusRules.customerCanCancel(order.getOrderStatus()))
                .build();
    }

    private List<OrderItemDetail> getItemDetails(List<OrderItem> orderItemList) {

        return orderItemList.stream().map(orderItem -> {
            return OrderItemDetail.builder()
                    .id(orderItem.getId())
                    .itemPrice(orderItem.getItemPrice())
                    .product(orderItem.getProduct())
                    .productVariantId(orderItem.getProductVariantId())
                    .quantity(orderItem.getQuantity())
                    .build();
        }).toList();
    }

    @Transactional
    public void cancelOrder(UUID id, Principal principal) {
        User user = (User) userDetailsService.loadUserByUsername(principal.getName());
        // Row lock: two cancels at once would otherwise both pass the status check
        // below and put the stock back twice.
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        if (!OrderStatusRules.customerCanCancel(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has already shipped and can't be cancelled");
        }
        order.changeStatus(OrderStatus.CANCELLED, "Cancelled by you");
        stockService.restore(order);
        orderRepository.save(order);
    }
}
