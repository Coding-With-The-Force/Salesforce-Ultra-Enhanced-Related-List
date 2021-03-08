import {ShowToastEvent} from "lightning/platformShowToastEvent";

/**
 * Created by gerry on 2/21/2021.
 */
export function sortRows(fieldName, direction, filteredLineItems){
	let parseData = JSON.parse(JSON.stringify(filteredLineItems));
	let keyValue = (fn) => {
		return fn[fieldName];
	};

	let isReverse = direction === 'asc' ? 1 : -1;
	let finalOutput = null;

	parseData.sort((x, y) => {
		if((isNaN(keyValue(x)) && isNaN(keyValue(y))) || (typeof keyValue(x) === "boolean" && typeof keyValue(y) === "boolean")){
			x = keyValue(x) ? keyValue(x).toString().toLowerCase() : '';
			y = keyValue(y) ? keyValue(y).toString().toLowerCase() : '';
			finalOutput = isReverse * ((x > y) - (y > x));
		}
		else{
			x = keyValue(x) ? parseInt(keyValue(x)) : 0;
			y = keyValue(y) ? parseInt(keyValue(y)) : 0;
			finalOutput = isReverse * (x-y);
		}

		return finalOutput;
	});
	return parseData;
}

export function showToast(_title, _message, _variant, _mode){
	return new ShowToastEvent({
		title: _title,
		message: _message,
		variant: _variant,
		mode: _mode
	});
}

export function searchTable(searchTerm, dataTableRows, searchKeys){
	const upperCaseSearchTerm = searchTerm.toUpperCase();
	let continueLoop = false;
	let filteredDataTableRows = [];
	dataTableRows.forEach(row=>{
		continueLoop = true;
		let rowKeys = Object.keys(row);
		rowKeys.forEach((rowKey) =>{
			const fieldValue = row[rowKey];
			if(continueLoop && searchKeys[rowKey]){
				const fieldToMatch = fieldValue.toUpperCase();
				if(fieldToMatch.includes(upperCaseSearchTerm)) {
					filteredDataTableRows.push(row);
					continueLoop = false;
				}
			}
		});
	});
	return filteredDataTableRows;
}

export function manageRowSelection(evt, allSelectedRows, checkedIds, pageNumber){
	let allRowsWithoutDeSelectedItem; // holds id's of remaining rows after deselection
	let pageSelectedRows; // holds the Id's of the selected rows on the current page

	let selectedRows = evt.detail.selectedRows; // get the rows that are currently selected on the page
	let selectedRowsArray = Object.keys(selectedRows).map(key => selectedRows[key].Id); //extract the row Id's from the event object

	let pageSelectedRowMapResult; //holds a key value pair of the selected rows on the current page (before this event)
	if (checkedIds) {
		pageSelectedRowMapResult = checkedIds.get(pageNumber);
	}
	else {
		pageSelectedRowMapResult = selectedRowsArray;
	}
	if (pageSelectedRowMapResult) //handle if last box on a page is deselected
	{
		pageSelectedRows = Array.from(pageSelectedRowMapResult.values()); //the values from map (_this.checkedIds) is an array of strings.  need ro decompose into an array of strings
	}

	allSelectedRows.push(...selectedRowsArray);
	allSelectedRows = [...new Set(allSelectedRows)];  // make the array unique

	const deselectedItem = findDeselectedItem(selectedRowsArray, pageSelectedRows);  // if an item was deselected, get its Id
	if (deselectedItem) {
		allRowsWithoutDeSelectedItem = allSelectedRows.filter(item => item !== deselectedItem); //remove the deselected item from the array containing all the selected rows
	}
	else {
		allRowsWithoutDeSelectedItem = allSelectedRows;
	}
	checkedIds.set(pageNumber, selectedRowsArray);

	//console.log('The checked Ids ::: ' + this._checkedIds.get(this.pageNumber));
	return {allRowsWithoutDeSelectedItem, checkedIds};

	function findDeselectedItem(CurrentArray, PreviousArray) {
		if (PreviousArray) {
			let currentSet = new Set(CurrentArray); //make sure only unique items (Set)
			return PreviousArray.filter(item => !currentSet.has(item));
		}
		else {
			return null;
		}
	}
}