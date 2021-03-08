public with sharing class Org_DataTable_TypeAttributes_Wrapper {
    //Attribute for row actions
    @AuraEnabled
    public List<Org_DataTable_RowActions> rowActions;

    //Attributes for URLs
    @AuraEnabled
    public Org_DataTable_Label_Attribute_Details label;
    @AuraEnabled
    public String target;

    //Attributes for dates
    @AuraEnabled
    public String month;
    @AuraEnabled
    public String day;

    //Attributes for picklists
    @AuraEnabled
    public String placeholder;
    @AuraEnabled
    public List<Org_DataTable_Select_Option> options;
    @AuraEnabled
    public Org_DataTable_Label_Attribute_Details value;
    @AuraEnabled
    public Org_DataTable_Label_Attribute_Details context;
}