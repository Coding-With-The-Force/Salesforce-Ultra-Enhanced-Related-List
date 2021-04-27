import { LightningElement, api } from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import {NavigationMixin} from "lightning/navigation";
import {loadStyle} from "lightning/platformResourceLoader";
import getPageSizeOptionsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getTableSizeOptionsController';
import getDataTableColumnsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getDataTableColumnsController';
import getTableDataFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getTableDataController';
import getViewObjectFieldsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getViewRecordFields';
import getSearchableFieldsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getSearchableFields';
import getObjectLabelFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getObjectLabel';
import massDeleteRecordsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.massDeleteRecords';
import saveTableDataToServerController from '@salesforce/apex/Org_Ultra_Related_List_Controller.saveTableDataToServer';
import getRecordTypeId from '@salesforce/apex/Org_Ultra_Related_List_Controller.getRecordTypeId';
import orgUltraEnhancedRelatedListStyle from '@salesforce/resourceUrl/Org_Ultra_Related_List_Styles';
import getColumnStylesFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getColumnStyles';
import {deleteRecord} from 'lightning/uiRecordApi';
import {sortRows, showToast, searchTable, manageRowSelection} from "c/datatableUtils";

export default class Org_ultra_enhanced_related_list extends NavigationMixin(LightningElement) {

    @api recordId;
    @api relatedObjectName;
    @api relatedFieldName;
    @api showNewButton;
    @api editableRelatedRecordField;
    @api editableRelatedObjectType;
    @api showDeleteButton;
    @api showPaginationControls;
    @api searchTableLabel;

    objectLabel = '';
    recordTypeName;
    draftValues = [];
    objectViewFields;
    openModal = false;
    showRecordView = false;
    viewRowRecordId = '';
    columnStyleList = [];

    sortDirection = 'asc';
    rowSelectedForSorting = 'Id';

    pageSize = 10;
    pageSizeLabel = "10";
    pageSizeOptions = [];
    currentPageNumber = 1;

    dataTableColumns;
    allDataTableRows = [];
    allSelectedRowIds = [];
    filteredDataTableRows = [];
    pageSelectedRowIds = [];
    _checkedIds = new Map();
    _searchableFields = new Map();
    pageHasChanged = false;


    connectedCallback()
    {
        loadStyle(this, orgUltraEnhancedRelatedListStyle).then(() => {
            this._getRecordTypeId();
        });

    }

    _getRecordTypeId(){
        getRecordTypeId({"recordId": this.recordId}).then(result=>{
            this.recordTypeName = result;
            this.getDataTableColumns();
        }).catch(error=>{
            console.error('There was a problem retrieving the record type ::: ' + error);
        });
    }

    _getObjectLabel(){
        getObjectLabelFromController({"objectAPIName": this.relatedObjectName}).then(
            result=>{
                this.objectLabel = result;
            }
        ).catch(error=>{
            console.error('Error retrieving the object name from the controller ' + JSON.stringify(error));
        });
    }

    getDataTableColumns()
    {
        getDataTableColumnsFromController({"objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(
            result =>{
                const cssClassRegex = new RegExp('cssclass', 'g');
                let fixedColumns = JSON.stringify(result).replace(cssClassRegex, 'class');
                console.log('These are the data table columns ::: ' + fixedColumns);
                this.dataTableColumns = JSON.parse(fixedColumns);
                this.getColumnStyles();
            }).catch(error => {
            console.error('Error retrieving data table columns from the controller ' + JSON.stringify(error));
        });
    }

    getColumnStyles(){
        getColumnStylesFromController({"objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(result =>{
            this.columnStyleList = result;
            this.getTableData();
            this._getObjectLabel();
            this._getPageSizeOptions();
            this._getViewRecordFields();
            this._getSearchableFields();
        }).catch(error=>{
           console.error('Error retrieving data table styles from the controller ' + JSON.stringify(error));
        });
    }

    @api getTableData()
    {
        getTableDataFromController({"recordId": this.recordId, "relatedObjectField": this.relatedFieldName, "objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(
            result =>{
                this.allDataTableRows = this._createFlattenedData(result);
                this.filteredDataTableRows = this.allDataTableRows;
                console.log('These are the table rows ::: ' + JSON.stringify(this.filteredDataTableRows));
                this.showPaginationControls = (this.filteredDataTableRows == undefined || this.filteredDataTableRows.length <= this.pageSize) ? false : true;
            }).catch(error => {
            console.error('Error retrieving data from the controller ' + JSON.stringify(error));
        });
    }

    searchDataTable(event)
    {
        this.filteredDataTableRows = searchTable(event.target.value, this.allDataTableRows, this._searchableFields);
        this.showPaginationControls = (this.filteredDataTableRows == undefined || this.filteredDataTableRows.length <= this.pageSize) ? false : true;
        this.currentPageNumber = 1;
    }

    _createFlattenedData(returnedData){
        let dataArray = [];
        returnedData.forEach(row => {
            const flattenedRow = {}
            // get keys of a single row — Name, Phone, LeadSource and etc
            let rowKeys = Object.keys(row);
            let rowValues = Object.values(row);
            rowKeys.forEach((rowKey) => {
                //get the value of each key of a single row. John, 999-999-999, Web and etc
                const singleNodeValue = row[rowKey];
                console.log('This is the row key ::: ' + rowKey + ' ::: This is the single node value ::: ' + JSON.stringify(singleNodeValue) + ' ::: This is the value ::: ' + JSON.stringify(rowValues));
                //check if the value is a node(object) or a string
                if (singleNodeValue.constructor === Object) {
                    //if it's an object flatten it
                    this._flattenRow(singleNodeValue, flattenedRow, rowKey)
                } else {
                    //if it’s a normal string push it to the flattenedRow array
                    flattenedRow[rowKey] = singleNodeValue;
                }
                this._determineRowStyles(flattenedRow, row, rowKey);
            });
            dataArray.push(flattenedRow);
        });
        return dataArray
    }

    _determineRowStyles(flattenedRow, row, rowKey){
        this.columnStyleList.forEach(style =>{
            if(style.UE_Related_List_Column_Link__r.Field_Name__c == rowKey){
                if(style.Comparison_Criteria__c == 'equal to' && row[rowKey] == style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
                else if(style.Comparison_Criteria__c == 'not equal to' && row[rowKey] != style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
                else if(style.Comparison_Criteria__c == 'greater than' && row[rowKey] < style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
                else if(style.Comparison_Criteria__c == 'greater than or equal to' && row[rowKey] <= style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
                else if(style.Comparison_Criteria__c == 'less than' && row[rowKey] > style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
                else if(style.Comparison_Criteria__c == 'less than or equal to' && row[rowKey] >= style.Comparison_Value__c){
                    flattenedRow[this.relatedObjectName + this.recordTypeName + rowKey] = style.CSS_Class_Name__c;
                }
            }
        });
    }

    _flattenRow(nodeValue, flattenedRow, nodeName){
        let rowKeys = Object.keys(nodeValue);
        rowKeys.forEach((key) => {
            let finalKey = nodeName + '.'+ key;
            flattenedRow[finalKey] = nodeValue[key];
        })
    }

    _getPageSizeOptions()
    {
        getPageSizeOptionsFromController({"objectType": this.relatedObjectName}).then(
            result =>
            {
                let pageSizeOptions = [];

                result.forEach(sizeOption =>{
                    pageSizeOptions.push({label: sizeOption.Label, value: sizeOption.Page_Size__c});
                });

                this.pageSizeOptions = pageSizeOptions;
            }).catch(error => {
            console.error('page size retrieval error ' + JSON.stringify(error));
        });
    }

    _getViewRecordFields(){
        getViewObjectFieldsFromController({"objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(result =>{
            this.objectViewFields = this._generateObjectFields(result);
        }).catch(error =>{
            console.error('There was an issue retrieving the new record fields from the controller : ' + JSON.stringify(error));
        });
    }

    _getSearchableFields(){
        getSearchableFieldsFromController({"objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(result=>{
            this._searchableFields = result;
        }).catch(error=>{
            console.error("There was an issue setting up the searchable fields ::: " + JSON.stringify(error));
        });
    }

    _generateObjectFields(fieldArray){
        let objectFields = [];
        fieldArray.forEach(fieldName =>{
            objectFields.push({fieldApiName: fieldName, objectApiName: this.relatedObjectName});
        });
        return objectFields;
    }

    updateNumberOfItemsPerPage(event)
    {
        let valObjSelected = this.pageSizeOptions.filter(obj => {
            return parseInt(obj.value) === parseInt(event.detail.value);
        });
        this.pageSize = valObjSelected[0].value;
        this.showPaginationControls = (this.filteredDataTableRows == undefined || this.filteredDataTableRows.length <= this.pageSize) ? false : true;
        this.pageSizeLabel = valObjSelected[0].label;
        this.currentPageNumber = 1;
    }

    sortRowData(event)
    {
        this.rowSelectedForSorting = '';
        let columnObj = this.dataTableColumns.filter(obj => {
            return obj.fieldName === event.detail.fieldName;
        });
        this.sortDirection = event.detail.sortDirection;
        let sortField;
        if (columnObj[0].type === 'url') {
            sortField = columnObj[0].typeAttributes.label.fieldName;
        }
        else {
            sortField = columnObj[0].fieldName;
        }
        this.filteredDataTableRows = sortRows(sortField, this.sortDirection, this.filteredDataTableRows);
        this.rowSelectedForSorting = event.detail.fieldName;
    }

    addRowToSelectedDataTableRowMap(event)
    {
        let allSelectedRows = this.allSelectedRowIds; // get the property holding the previously selected rows
        let checkedIds = this._checkedIds;
        let pageNumber = this.currentPageNumber;
        const selectionObj = manageRowSelection(event, allSelectedRows, checkedIds, pageNumber);
        this.allSelectedRowIds = selectionObj.allRowsWithoutDeSelectedItem;
        this._checkedIds = selectionObj.checkedIds;
    }

    doSelectedRowAction(event)
    {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this._deleteRow(row);
                break;
            case 'view':
                this._viewRow(row);
                break;
            case 'edit':
                this._editRow(row);
                break;
            case 'editRelated':
                this._editRelatedRecord(row);
                break;
            default:
        }
    }

    _deleteRow(row){
        deleteRecord(row.Id).then(() => {
            this.getTableData();
            this.dispatchEvent(showToast('Success', 'Record Deleted', 'success', 'dismissible'));
        }).catch(error => {
            console.error(error);
            const errorMsg = 'There was an error deleting the data in the table ::: ' + JSON.stringify(error);
            this.dispatchEvent(showToast('Error deleting record', errorMsg, 'error', 'dismissible'));
        });
    }

    _viewRow(row){
        this.viewRowRecordId = row.Id;
        this.openModal = true;
        this.showRecordView = true;
    }

    _editRow(row){
        this._navigateToEditPage(row.Id, this.relatedObjectName);
    }

    _editRelatedRecord(row){
        this._navigateToEditPage(row[this.editableRelatedRecordField], this.editableRelatedObjectType);
    }

    _navigateToEditPage(recordId, objectName){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: objectName,
                actionName: 'edit',
            },
        });
    }

    createNewRecord()
    {
        Promise.all(this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: this.relatedObjectName, // pass the record id here.
                actionName: 'new',
            },
        })).then(() =>{
            this.getTableData();
        });
    }

    saveTableDataToServer(event)
    {
        saveTableDataToServerController({"objectType": this.relatedObjectName, "tableDataJSON": JSON.stringify(event.detail.draftValues)}).then(
            result =>
            {
                this.template.querySelector("lightning-datatable").draftValues = [];
                this.getTableData();
                this.dispatchEvent(showToast('Success', 'Record(s) Updated', 'success', 'dismissible'));
            }).catch(error => {
            const errorMsg = 'There was an error saving the data in the table ::: ' + JSON.stringify(error);
            this.dispatchEvent(showToast('Error saving record(s)', errorMsg, 'error', 'dismissible'));
        });
    }

    closeModal(){
        this.openModal = false;
        this.showRecordView = false;
    }

    deleteSelectedRecords(){
        let selectedRowData = [];
        this.allDataTableRows.filter(item => {
            if(this.allSelectedRowIds.includes(item.Id)){
                selectedRowData.push(item.Id);
            }
        });
        if (selectedRowData) {
            massDeleteRecordsFromController({recordIds: JSON.stringify(selectedRowData), objectType: this.relatedObjectName}).then(
                result => {
                    this._checkedIds.clear();
                    this.allSelectedRowIds = [];
                    this.pageSelectedRowIds = [];
                    this.firstPage();
                    this.getTableData();
                    this.dataTableColumns = [...this.dataTableColumns];
                    this.dispatchEvent(showToast('Success', 'Deletion Successful', 'success', 'dismissible'));
                }).catch(error => {
                this.dispatchEvent(showToast('No Records Were Deleted', error.body.message, 'error', 'dismissible'));
            });
            this.dataTableColumns = [...this.dataTableColumns];
        }
        else //handle when all inputs are empty
        {
            this.dispatchEvent(showToast('No Records Were Deleted', 'Please make at least one item is selected for deletion.', 'error', 'dismissible'));
        }
    }

    //Start Pagination Methods
    /** @description Handles nextPage button click*/
    nextPage() {
        this.currentPageNumber = Math.min(
            this.currentPageNumber + 1,
            this.maxPageNumber
        );

        if (this._checkedIds.get(this.currentPageNumber)) {
            this.pageSelectedRowIds = this._checkedIds.get(this.currentPageNumber);
        }

        this.pageHasChanged = true;
    }

    /** @description Handles previousPage button click*/
    previousPage() {
        this.currentPageNumber = Math.max(1, this.currentPageNumber - 1);

        if (this._checkedIds.get(this.currentPageNumber)) {
            this.pageSelectedRowIds = this._checkedIds.get(this.currentPageNumber);
        }

        this.pageHasChanged = true;
    }

    /** @description Handles nextPage button click*/
    firstPage() {
        this.currentPageNumber = 1;

        if (this._checkedIds.get(this.currentPageNumber)) {
            this.pageSelectedRowIds = this._checkedIds.get(this.currentPageNumber);
        }

        this.pageHasChanged = true;
    }

    /** @description Handles lastPage button click*/
    lastPage() {
        this.currentPageNumber = this.maxPageNumber;

        if (this._checkedIds.get(this.pageNumber)) {
            this.pageSelectedRowIds = this._checkedIds.get(this.currentPageNumber);
        }
        this.pageHasChanged = true;
    }

    /** @description Calculates the number of pages based on the number of rows and the page size
     *  @returns {number} - the number of pages
     */
    get maxPageNumber() {
        return Math.floor(
            (this.filteredDataTableRows.length + (this.pageSize - 1)) / this.pageSize
        );
    }

    /** @description Getter that calculates the rows to display on the current page and populates the currentPage property
     *  @returns An array of objects
     */
    get currentPage() {
        return this.filteredDataTableRows.slice((this.currentPageNumber - 1) * this.pageSize, this.currentPageNumber * this.pageSize);
    }

    get returnedRows(){
        return '(' + this.allDataTableRows.length + ')';
    }

    get headerLabel(){
        return this.objectLabel + 's';
    }
}