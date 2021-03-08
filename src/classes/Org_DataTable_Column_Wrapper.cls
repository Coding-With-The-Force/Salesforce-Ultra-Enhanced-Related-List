public with sharing class Org_DataTable_Column_Wrapper {
    @AuraEnabled
    public String label;
    @AuraEnabled
    public String fieldName;
    @AuraEnabled
    public String type;
    @AuraEnabled
    public boolean sortable;
    @AuraEnabled
    public boolean editable;
    @AuraEnabled
    public Org_DataTable_TypeAttributes_Wrapper typeAttributes;
}