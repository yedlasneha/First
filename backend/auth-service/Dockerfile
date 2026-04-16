FROM eclipse-temurin:17-jre
WORKDIR /app
COPY auth-service/target/auth-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
