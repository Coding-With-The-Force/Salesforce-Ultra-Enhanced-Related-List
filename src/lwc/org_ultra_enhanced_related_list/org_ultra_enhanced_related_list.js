import { LightningElement, api } from 'lwc';
import {NavigationMixin} from "lightning/navigation";
import getPageSizeOptionsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getTableSizeOptionsController';
import getDataTableColumnsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getDataTableColumnsController';
import getTableDataFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getTableDataController';
import getViewObjectFieldsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getViewRecordFields';
import getSearchableFieldsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.getSearchableFields';
import massDeleteRecordsFromController from '@salesforce/apex/Org_Ultra_Related_List_Controller.massDeleteRecords';
import saveTableDataToServerController from '@salesforce/apex/Org_Ultra_Related_List_Controller.saveTableDataToServer';
import getRecordTypeId from '@salesforce/apex/Org_Ultra_Related_List_Controller.getRecordTypeId';
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
    @api searchTableLabel
    recordTypeName;
    draftValues = [];
    objectViewFields;
    openModal = false;
    showRecordView = false;
    viewRowRecordId = '';

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
        this._getRecordTypeId();
    }

    _getRecordTypeId(){
        getRecordTypeId({"recordId": this.recordId}).then(result=>{
            this.recordTypeName = result;
            this.getDataTableColumns();
            this.getTableData();
            this._getPageSizeOptions();
            this._getViewRecordFields();
            this._getSearchableFields();
        }).catch(error=>{
            console.error('There was a problem retrieving the record type ::: ' + error);
        });
    }

    getDataTableColumns()
    {
        getDataTableColumnsFromController({"objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(
            result =>{
                this.dataTableColumns = result;
            }).catch(error => {
            console.error('Error retrieving data table columns from the controller ' + JSON.stringify(error));
        });
    }

    @api getTableData()
    {
        getTableDataFromController({"recordId": this.recordId, "relatedObjectField": this.relatedFieldName, "objectType": this.relatedObjectName, "recordTypeName": this.recordTypeName}).then(
            result =>{
                this.allDataTableRows = this._createFlattenedData(result);
                this.filteredDataTableRows = this.allDataTableRows;
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

            rowKeys.forEach((rowKey) => {
                //get the value of each key of a single row. John, 999-999-999, Web and etc
                const singleNodeValue = row[rowKey];
                //check if the value is a node(object) or a string
                if (singleNodeValue.constructor === Object) {
                    //if it's an object flatten it
                    this._flattenRow(singleNodeValue, flattenedRow, rowKey)
                } else {
                    //if it’s a normal string push it to the flattenedRow array
                    flattenedRow[rowKey] = singleNodeValue;
                }
            });
            dataArray.push(flattenedRow);
        });
        return dataArray
    }

    _flattenRow (nodeValue, flattenedRow, nodeName){
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

    //handler to handle cell changes & update values in draft values
    handleCellChange(event) {
        this.updateDraftValues(event.detail.draftValues[0]);
    }

    picklistChanged(event) {
        event.stopPropagation();
        let dataRecieved = event.detail.data;
        let updatedItem = { Id: dataRecieved.context, Rating: dataRecieved.value };
        this.updateDraftValues(updatedItem);
        this.updateDataValues(updatedItem);
    }

    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        //store changed value to do operations
        //on save. This will enable inline editing &
        //show standard cancel & save button
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });

        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }

    updateDataValues(updateItem) {
        let copyData = [... this.allDataTableRows];
        copyData.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });

        //write changes back to original data
        this.allDataTableRows = [...copyData];
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
}