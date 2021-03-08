/**
 * Created by gerry on 2/21/2021.
 */

import LightningDatatable from 'lightning/datatable';
import DatatablePicklistTemplate from './picklistTemplate.html';
import { loadStyle } from 'lightning/platformResourceLoader';
import CustomDataTableResource from '@salesforce/resourceUrl/enhancedDataTable';

export default class OrgUltraEnhancedRelatedListDatatable extends LightningDatatable {
	static customTypes = {
		picklist: {
			template: DatatablePicklistTemplate,
			typeAttributes: ['label', 'sortable', 'editable', 'placeholder', 'options', 'value', 'context'],
		},

	};

	renderedCallback() {
		Promise.all([
			loadStyle(this, CustomDataTableResource),
		]).then(() => { })
	}
}