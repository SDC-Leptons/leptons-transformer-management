package com.example.transformer_app.model;

import java.util.Date;
import java.util.Map;

public class Maintenance {
    private Long mid;
    private String maintenanceNumber;
    private String inspectionNumber;
    private String inspectorName;
    private String status;
    private Map<String, Object> electricalReadings;
    private String recommendedActions;
    private String additionalRemarks;
    private Date createdAt;
    // Single JSON column to store extended maintenance information used by the new UI
    private Map<String, Object> details;

    // Constructors
    public Maintenance() {
    }

    public Maintenance(Long mid, String maintenanceNumber, String inspectionNumber, String inspectorName,
                       String status, Map<String, Object> electricalReadings, String recommendedActions,
                       String additionalRemarks, Date createdAt, Map<String, Object> details) {
        this.mid = mid;
        this.maintenanceNumber = maintenanceNumber;
        this.inspectionNumber = inspectionNumber;
        this.inspectorName = inspectorName;
        this.status = status;
        this.electricalReadings = electricalReadings;
        this.recommendedActions = recommendedActions;
        this.additionalRemarks = additionalRemarks;
        this.createdAt = createdAt;
        this.details = details;
    }

    // Getters and Setters
    public Long getMid() {
        return mid;
    }

    public void setMid(Long mid) {
        this.mid = mid;
    }

    public String getMaintenanceNumber() {
        return maintenanceNumber;
    }

    public void setMaintenanceNumber(String maintenanceNumber) {
        this.maintenanceNumber = maintenanceNumber;
    }

    public String getInspectionNumber() {
        return inspectionNumber;
    }

    public void setInspectionNumber(String inspectionNumber) {
        this.inspectionNumber = inspectionNumber;
    }

    public String getInspectorName() {
        return inspectorName;
    }

    public void setInspectorName(String inspectorName) {
        this.inspectorName = inspectorName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getElectricalReadings() {
        return electricalReadings;
    }

    public void setElectricalReadings(Map<String, Object> electricalReadings) {
        this.electricalReadings = electricalReadings;
    }

    public String getRecommendedActions() {
        return recommendedActions;
    }

    public void setRecommendedActions(String recommendedActions) {
        this.recommendedActions = recommendedActions;
    }

    public String getAdditionalRemarks() {
        return additionalRemarks;
    }

    public void setAdditionalRemarks(String additionalRemarks) {
        this.additionalRemarks = additionalRemarks;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
