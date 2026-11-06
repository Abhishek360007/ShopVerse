package com.shopverse.services;

import java.math.BigDecimal;
import com.shopverse.dto.OrderItemRequest;
import com.stripe.model.PaymentIntent;
import com.shopverse.auth.dto.OrderResponse;
import com.shopverse.auth.entities.User;
import com.shopverse.dto.OrderDetails;
import com.shopverse.dto.OrderItemDetail;
import com.shopverse.dto.OrderRequest;
import com.shopverse.entities.*;
import com.shopverse.repositories.OrderRepository;
import jakarta.transaction.Transactional;
import org.apache.coyote.BadRequestException;
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


    @Transactional
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
                    .itemPrice(product.getPrice().doubleValue())
                    .build());
            OrderStock.take(product, itemRequest.getProductVariantId(), itemRequest.getQuantity());
        }

        Calendar delivery = Calendar.getInstance();
        delivery.add(Calendar.DAY_OF_MONTH, DELIVERY_DAYS);

        Order order= Order.builder()
                .user(user)
                .address(address)
                .totalAmount(total.doubleValue())
                .orderDate(new Date())
                .discount(0.0)
                .expectedDeliveryDate(delivery.getTime())
                .paymentMethod("CARD".equals(orderRequest.getPaymentMethod()) ? "CARD" : "COD")
                .orderStatus(OrderStatus.PENDING)
                .build();
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

    public Map<String,String> updateStatus(String paymentIntentId, String status) {

        try{
            PaymentIntent paymentIntent= PaymentIntent.retrieve(paymentIntentId);
            if (paymentIntent != null && paymentIntent.getStatus().equals("succeeded")) {
               String orderId = paymentIntent.getMetadata().get("orderId") ;
               Order order= orderRepository.findById(UUID.fromString(orderId)).orElseThrow(BadRequestException::new);
               Payment payment = order.getPayment();
               payment.setPaymentStatus(PaymentStatus.COMPLETED);
                payment.setPaymentMethod(paymentIntent.getPaymentMethod());
                order.setPaymentMethod(paymentIntent.getPaymentMethod());
                order.setOrderStatus(OrderStatus.IN_PROGRESS);
                order.setPayment(payment);
                Order savedOrder = orderRepository.save(order);
                Map<String,String> map = new HashMap<>();
                map.put("orderId", String.valueOf(savedOrder.getId()));
                return map;
            }
            else{
                throw new IllegalArgumentException("PaymentIntent not found or missing metadata");
            }
        }
        catch (Exception e){
            throw new IllegalArgumentException("PaymentIntent not found or missing metadata");
        }
    }

    public List<OrderDetails> getOrdersByUser(String name) {
        User user = (User) userDetailsService.loadUserByUsername(name);
        List<Order> orders = orderRepository.findByUser(user);
        return orders.stream().map(order -> {
            return OrderDetails.builder()
                    .id(order.getId())
                    .orderDate(order.getOrderDate())
                    .orderStatus(order.getOrderStatus())
                    .shipmentNumber(order.getShipmentTrackingNumber())
                    .address(order.getAddress())
                    .totalAmount(order.getTotalAmount())
                    .orderItemList(getItemDetails(order.getOrderItemList()))
                    .expectedDeliveryDate(order.getExpectedDeliveryDate())
                    .build();
        }).toList();

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
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        if (!OrderStatusRules.customerCanCancel(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has already shipped and can't be cancelled");
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        OrderStock.restore(order);
        orderRepository.save(order);
    }
}
