package com.example.transformer_app.controller;

import com.example.transformer_app.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RetrainController {

    @Autowired
    private InspectionService inspectionService;

    @PostMapping("/retrain")
    public ResponseEntity<String> retrain() {
        try {
            inspectionService.triggerRetraining();
            return ResponseEntity.ok("{\"message\":\"Retraining triggered\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}

