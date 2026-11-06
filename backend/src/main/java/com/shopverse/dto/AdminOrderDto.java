package com.shopverse.dto;

import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Order as shown in the admin dashboard. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderDto {
    private UUID id;
    private Date orderDate;
    private Date expectedDeliveryDate;
    private OrderStatus orderStatus;
    private Set<OrderStatus> nextStatuses;
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private Double totalAmount;
    private Integer itemCount;
    private String customerName;
    private String customerEmail;
    private String phoneNumber;
    private String shippingAddress;
    private List<AdminOrderItemDto> items;
    private String trackingNumber;
    private List<StatusEventDto> statusHistory;
}
