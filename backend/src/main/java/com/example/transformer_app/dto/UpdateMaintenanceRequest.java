package com.example.transformer_app.dto;

import java.util.List;
import java.util.Map;

public class UpdateMaintenanceRequest {
    private String inspectorName;
    private String status;
    private Map<String, Object> details;
    private String branch;
    private String locationDetails;
    private String inspectionDate;
    private String inspectionTime;
    private Map<String, Object> baseLineImagingNos;
    private String lastMonthKVA;
    private String lastMonthDate;
    private String lastMonthTime;
    private String currentMonthKVA;
    private String baseLineCondition;
    private String transformerType;
    private Map<String, Object> meterDetails;
    private List<Map<String, Object>> workContent;
    private Map<String, Object> firstInspectionReadings;
    private Map<String, Object> secondInspectionReadings;
    private String afterThermalDate;
    private String afterThermalTime;
    private Map<String, Object> fuseStatus;
    private String recommendedActions;
    private String additionalRemarks;

    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getLocationDetails() { return locationDetails; }
    public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }
    public String getInspectionDate() { return inspectionDate; }
    public void setInspectionDate(String inspectionDate) { this.inspectionDate = inspectionDate; }
    public String getInspectionTime() { return inspectionTime; }
    public void setInspectionTime(String inspectionTime) { this.inspectionTime = inspectionTime; }
    public Map<String, Object> getBaseLineImagingNos() { return baseLineImagingNos; }
    public void setBaseLineImagingNos(Map<String, Object> baseLineImagingNos) { this.baseLineImagingNos = baseLineImagingNos; }
    public String getLastMonthKVA() { return lastMonthKVA; }
    public void setLastMonthKVA(String lastMonthKVA) { this.lastMonthKVA = lastMonthKVA; }
    public String getLastMonthDate() { return lastMonthDate; }
    public void setLastMonthDate(String lastMonthDate) { this.lastMonthDate = lastMonthDate; }
    public String getLastMonthTime() { return lastMonthTime; }
    public void setLastMonthTime(String lastMonthTime) { this.lastMonthTime = lastMonthTime; }
    public String getCurrentMonthKVA() { return currentMonthKVA; }
    public void setCurrentMonthKVA(String currentMonthKVA) { this.currentMonthKVA = currentMonthKVA; }
    public String getBaseLineCondition() { return baseLineCondition; }
    public void setBaseLineCondition(String baseLineCondition) { this.baseLineCondition = baseLineCondition; }
    public String getTransformerType() { return transformerType; }
    public void setTransformerType(String transformerType) { this.transformerType = transformerType; }
    public Map<String, Object> getMeterDetails() { return meterDetails; }
    public void setMeterDetails(Map<String, Object> meterDetails) { this.meterDetails = meterDetails; }
    public List<Map<String, Object>> getWorkContent() { return workContent; }
    public void setWorkContent(List<Map<String, Object>> workContent) { this.workContent = workContent; }
    public Map<String, Object> getFirstInspectionReadings() { return firstInspectionReadings; }
    public void setFirstInspectionReadings(Map<String, Object> firstInspectionReadings) { this.firstInspectionReadings = firstInspectionReadings; }
    public Map<String, Object> getSecondInspectionReadings() { return secondInspectionReadings; }
    public void setSecondInspectionReadings(Map<String, Object> secondInspectionReadings) { this.secondInspectionReadings = secondInspectionReadings; }
    public String getAfterThermalDate() { return afterThermalDate; }
    public void setAfterThermalDate(String afterThermalDate) { this.afterThermalDate = afterThermalDate; }
    public String getAfterThermalTime() { return afterThermalTime; }
    public void setAfterThermalTime(String afterThermalTime) { this.afterThermalTime = afterThermalTime; }
    public Map<String, Object> getFuseStatus() { return fuseStatus; }
    public void setFuseStatus(Map<String, Object> fuseStatus) { this.fuseStatus = fuseStatus; }
    public String getRecommendedActions() { return recommendedActions; }
    public void setRecommendedActions(String recommendedActions) { this.recommendedActions = recommendedActions; }
    public String getAdditionalRemarks() { return additionalRemarks; }
    public void setAdditionalRemarks(String additionalRemarks) { this.additionalRemarks = additionalRemarks; }
}
