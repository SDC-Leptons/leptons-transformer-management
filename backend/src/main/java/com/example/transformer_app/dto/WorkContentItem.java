package com.example.transformer_app.dto;

public class WorkContentItem {
    private int no;
    private boolean C;
    private boolean CI;
    private boolean T;
    private boolean R;
    private String other;
    private String afterInspection;
    private String irNo;

    public int getNo() { return no; }
    public void setNo(int no) { this.no = no; }
    public boolean isC() { return C; }
    public void setC(boolean c) { C = c; }
    public boolean isCI() { return CI; }
    public void setCI(boolean CI) { this.CI = CI; }
    public boolean isT() { return T; }
    public void setT(boolean t) { T = t; }
    public boolean isR() { return R; }
    public void setR(boolean r) { R = r; }
    public String getOther() { return other; }
    public void setOther(String other) { this.other = other; }
    public String getAfterInspection() { return afterInspection; }
    public void setAfterInspection(String afterInspection) { this.afterInspection = afterInspection; }
    public String getIrNo() { return irNo; }
    public void setIrNo(String irNo) { this.irNo = irNo; }
}

