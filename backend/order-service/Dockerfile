FROM eclipse-temurin:17-jre
WORKDIR /app
COPY order-service/target/order-service-1.0.0.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
