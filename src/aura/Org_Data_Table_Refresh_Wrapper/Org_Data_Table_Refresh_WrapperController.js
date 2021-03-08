/**
 * Created by gerry on 3/8/2021.
 */

({
	doRefresh : function(component, event, helper) {
		component.find("enhanced_list").getTableData();
	}
})