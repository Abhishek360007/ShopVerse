package com.shopverse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One line of an order in the admin dashboard. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderItemDto {
    private String productName;
    private String thumbnail;
    private String size;
    private String color;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
}
