package com.sneha.KSR_Fruits.order.infrastructure.kafka;

import com.sneha.KSR_Fruits.common.dto.OrderEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Kafka producer stub — logs events instead of sending to Kafka.
 * Replace with real KafkaTemplate when Kafka is available.
 */
@Service
public class OrderProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderProducer.class);

    public void sendOrderEvent(OrderEvent event) {
        log.info("[ORDER EVENT] type={} orderId={} userId={} total={}",
                event.getEventType(), event.getOrderId(), event.getUserId(), event.getTotalAmount());
    }
}
