

const DELIVERY_DAYS = 5;

export const createOrderRequest = (cartItems,userId,addressId,paymentMethod='CARD')=>{
    let request = {};
    request.userId= userId;
    request.addressId = addressId;
    request.orderDate = new Date().toISOString();
    let orderItems = [];
    let amount = 0;
    cartItems?.forEach((item)=>{
        amount += item?.subTotal; 
        orderItems.push({
            productId: item.productId,
            productVariantId: item?.variant?.id,
            discount: 0,
            quantity: item?.quantity
        })
    });
    request.orderItemRequests = orderItems;
    request.totalAmount =  amount?.toFixed(2);
    request.discount = 0;
    request.paymentMethod= paymentMethod;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + DELIVERY_DAYS);
    request.expectedDeliveryDate = deliveryDate.toISOString();
    request.currency = "inr";
    return request;

}

/** The delivery steps, in order, with the words customers see. */
export const ORDER_STEPS = [
    { status: 'PENDING', label: 'Order placed', description: "We've received your order." },
    { status: 'CONFIRMED', label: 'Confirmed', description: 'Your order has been confirmed.' },
    { status: 'PACKED', label: 'Packed', description: 'Your items are packed and ready to ship.' },
    { status: 'SHIPPED', label: 'Shipped', description: 'Your order is on its way.' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', description: 'Our courier will deliver it today.' },
    { status: 'DELIVERED', label: 'Delivered', description: 'Your order has been delivered.' },
];

export const STATUS_LABELS = {
    ...Object.fromEntries(ORDER_STEPS.map((s) => [s.status, s.label])),
    CANCELLED: 'Cancelled',
};

/** 1-based position of a status in the delivery steps (0 when cancelled/unknown). */
export const getStepCount = Object.fromEntries(ORDER_STEPS.map((s, i) => [s.status, i + 1]));

/** Groups used by the "My orders" filter. */
export const orderGroup = (status) =>
    status === 'DELIVERED' ? 'COMPLETED' : status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE';
