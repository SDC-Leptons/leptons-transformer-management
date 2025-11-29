package com.example.transformer_app.dto;

public class VoltageCurrentReadings {
    private PhaseReadings voltage;
    private PhaseReadings current;

    public PhaseReadings getVoltage() { return voltage; }
    public void setVoltage(PhaseReadings voltage) { this.voltage = voltage; }
    public PhaseReadings getCurrent() { return current; }
    public void setCurrent(PhaseReadings current) { this.current = current; }
}

