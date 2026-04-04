package com.sneha.KSR_Fruits.product.infrastructure.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatConfig {

    /**
     * Remove Tomcat's default 2MB limit on HTTP POST body size.
     * Required for large base64 banner image uploads sent as JSON.
     * -1 = unlimited
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setMaxPostSize(-1);       // unlimited POST body
            connector.setMaxSavePostSize(-1);   // unlimited saved POST
        });
    }
}
