package com.shopverse.dto;

import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.OrderStatusEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/** One tracking step shown to customers and admins. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusEventDto {
    private OrderStatus status;
    private String note;
    private Date at;

    /** Tracking history; orders placed before history existed get a "placed" step from the order date. */
    public static List<StatusEventDto> historyOf(List<OrderStatusEvent> events, Date orderDate, OrderStatus current) {
        List<StatusEventDto> history = new ArrayList<>();
        if (events != null) {
            events.forEach(e -> history.add(new StatusEventDto(e.getStatus(), e.getNote(), e.getCreatedAt())));
        }
        if (history.isEmpty() || history.get(0).getStatus() != OrderStatus.PENDING) {
            history.add(0, new StatusEventDto(OrderStatus.PENDING, "Order placed", orderDate));
        }
        if (current != null && history.stream().noneMatch(h -> h.getStatus() == current)) {
            history.add(new StatusEventDto(current, null, null));   // status from before tracking was added
        }
        return history;
    }
}
