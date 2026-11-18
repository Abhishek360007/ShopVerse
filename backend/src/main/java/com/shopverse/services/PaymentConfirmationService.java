package com.shopverse.services;

import com.shopverse.entities.Order;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Payment;
import com.shopverse.entities.PaymentStatus;
import com.shopverse.repositories.OrderRepository;
import com.stripe.model.PaymentIntent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Records a successful Stripe payment on its order, exactly once.
 *
 * <p>Two signals can report the same payment: the browser (after Stripe.js confirms the
 * card) and the Stripe webhook (which still arrives if the customer closed the tab).
 * Both end here. The order row is locked ({@code SELECT ... FOR UPDATE}) and an already
 * completed payment is left alone, so whichever arrives second changes nothing.
 *
 * <p>Callers fetch the {@link PaymentIntent} from Stripe <em>before</em> calling this, so
 * no network call happens while the row lock is held. It lives in its own bean so that
 * {@code @Transactional} applies (a call from inside the same class would bypass the proxy).
 */
@Service
public class PaymentConfirmationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentConfirmationService.class);

    private final OrderRepository orderRepository;

    public PaymentConfirmationService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Marks the intent's order as paid if the intent succeeded.
     *
     * @return the order id, or empty if the intent didn't succeed or isn't one of ours
     */
    @Transactional
    public Optional<UUID> markPaid(PaymentIntent intent) {
        if (intent == null || !"succeeded".equals(intent.getStatus())) {
            return Optional.empty();
        }
        String orderId = intent.getMetadata() == null ? null : intent.getMetadata().get("orderId");
        if (orderId == null) {
            return Optional.empty();
        }
        UUID id;
        try {
            id = UUID.fromString(orderId);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
        Order order = orderRepository.findByIdForUpdate(id).orElse(null);
        if (order == null) {
            log.warn("Stripe payment {} names unknown order {}", intent.getId(), orderId);
            return Optional.empty();
        }
        Payment payment = order.getPayment();
        if (payment != null && payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            return Optional.of(order.getId()); // the other signal got here first
        }
        if (payment != null) {
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaymentMethod(intent.getPaymentMethod());
        }
        order.setPaymentMethod(intent.getPaymentMethod());
        if (order.getOrderStatus() == OrderStatus.PENDING) {
            order.changeStatus(OrderStatus.CONFIRMED, "Payment received");
        }
        orderRepository.save(order);
        log.info("Order {} paid with Stripe payment {}", order.getId(), intent.getId());
        return Optional.of(order.getId());
    }
}
