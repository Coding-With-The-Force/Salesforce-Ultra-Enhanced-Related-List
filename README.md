# Ultra_Enhanced_Related_List
Allows for a more enhanced related list.

Supported Features:
1) Mass Edits (only works for fields directly on the object currently)
2) Mass Deletes
3) Editing records related to the records in the related list
4) Pagination
5) Selective Searching
6) Selective Sorting
7) View only modal
8) New record creation (single record at a time)
9) Changing the amount of records show in the table at once (current limit 1k records).
10) Communication with Aura Components using the included application aura event 

Tutorial video, instructions on how to install and more will be here soon.

Current limitations being worked through:
1) Adding picklists and lookups to the table for editing.
2) Being able to mass edit fields on related objects from within the table.
3) Dynamically rendering the checkboxes and table numbers when they aren't wanted.
4) Figuring out how to load more than 1k records into the table without SF having a panic attack.

Current code related improvements on the list:
1) Creating a generic test class
2) Refactoring the mass update code to make it even more generic and faster
3) Documentation/Comments
4) Improving error handling
