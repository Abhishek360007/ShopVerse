package com.shopverse.controllers;

import com.shopverse.services.PaymentConfirmationService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe webhook: Stripe tells the server directly when a payment succeeds.
 *
 * <p>Without it, an order is only marked paid when the browser reports back, so a
 * customer who closes the tab right after paying leaves a paid order stuck as PENDING.
 * The webhook is the reliable signal; the browser call is just the fast path. Both use
 * {@link PaymentConfirmationService#markPaid}, which records a payment at most once.
 *
 * <p>Security: the request is accepted only with a valid {@code Stripe-Signature} for the
 * exact raw body ({@code STRIPE_WEBHOOK_SECRET}); the payment is then re-read from Stripe
 * rather than trusted from the event. With no secret configured the endpoint is off (404).
 */
@RestController
@RequestMapping("/api/payments/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final PaymentConfirmationService paymentConfirmationService;
    private final String webhookSecret;

    public StripeWebhookController(PaymentConfirmationService paymentConfirmationService,
                                   @Value("${stripe.webhook-secret:}") String webhookSecret) {
        this.paymentConfirmationService = paymentConfirmationService;
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handle(@RequestBody String payload,
                                       @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        if (webhookSecret.isEmpty() || webhookSecret.equals("not-configured")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException | RuntimeException e) {
            log.warn("Rejected Stripe webhook with a missing or invalid signature");
            return ResponseEntity.badRequest().build();
        }

        if (!"payment_intent.succeeded".equals(event.getType())) {
            return ResponseEntity.ok().build(); // acknowledged; nothing to do for other events
        }
        String intentId = intentId(event);
        if (intentId == null) {
            return ResponseEntity.ok().build();
        }
        try {
            // Re-read the payment from Stripe: the source of truth, whatever the event said.
            paymentConfirmationService.markPaid(PaymentIntent.retrieve(intentId));
        } catch (StripeException e) {
            // 5xx makes Stripe retry the webhook later
            log.warn("Could not load Stripe payment {} for webhook: {}", intentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        return ResponseEntity.ok().build();
    }

    private static String intentId(Event event) {
        StripeObject object = event.getDataObjectDeserializer().getObject().orElseGet(() -> {
            try {
                // The event's API version can differ from the library's; read it anyway.
                return event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (Exception e) {
                return null;
            }
        });
        return object instanceof PaymentIntent intent ? intent.getId() : null;
    }
}
