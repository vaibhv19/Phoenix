package com.resume.phoenix.document.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${app.python-ai-engine.url:http://localhost:8000}")
    private String pythonAiEngineUrl;

    @Bean
    public RestClient restClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(60000);

        return RestClient.builder()
                .baseUrl(pythonAiEngineUrl)
                .requestFactory(requestFactory)
                .build();
    }
}
