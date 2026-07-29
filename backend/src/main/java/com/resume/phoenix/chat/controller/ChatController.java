package com.resume.phoenix.chat.controller;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.chat.dto.ChatRequest;
import com.resume.phoenix.chat.dto.ChatResponse;
import com.resume.phoenix.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/query")
    public ResponseEntity<ChatResponse> queryRAG(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user
    ) {
        ChatResponse response = chatService.queryRAG(request, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatResponse>> getChatHistory(
            @RequestParam("projectId") UUID projectId,
            @AuthenticationPrincipal User user
    ) {
        List<ChatResponse> response = chatService.getChatHistory(projectId, user.getId());
        return ResponseEntity.ok(response);
    }
}
