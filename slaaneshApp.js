function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var db=null;
var items=[];
var item=null;
var itemIndex=0;
var list={};
var currentListItem=null;
var currentDialog=null;
var depth=0;
var path=[];
var lastSave=null;
var keyCode=null;
var unlocked=false;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart={};
// var dragEnd=0;

// DRAG TO CHANGE DEPTH
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
    // console.log('start drag at '+dragStart.x+','+dragStart.y);
})

id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    // console.log('drag '+drag.x+','+drag.y);
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x<-50)&&(depth>0)) { // drag right to decrease depth...
        console.log('path: '+path);
        /*
        if(path[path.length-1]=='CHECK') {
            path.pop();
            populateList(); // ...or just return from 'check' view
            return;
        }
        */
        list.id=list.owner;
        path.pop();
        depth--;
        if(depth<1) list.id=list.owner=null;
        console.log('list.id: '+list.id+' path: '+path+' depth: '+depth);
        loadListItems();
    }
})

// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(depth>0) { // list heading - show item edit dialog
		id(itemField.value=list.name); // cryptify(item.text,keyCode));
		if(items.length>0) {
			id('deleteItemGroup').style.display='none';
			console.log('disable delete');
		}
		else id('deleteItemGroup').style.display='block';
		// id('deleteItemButton').disabled=(items.length>0); // cannot delete lists with content
		showDialog('itemDialog',true);
	}
	else backup(); // depth 0 = top level - force backup
});

// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
    }
}

/* SHOW CONTROLS FOR EDITING
function showControls() {
    if(currentDialog===null) { // first click on item
        if(currentListItem) currentListItem.children[0].style.backgroundColor='black'; // deselect any previously selected item
        itemIndex=parseInt(itemIndex);
	    item=items[itemIndex];
	    console.log("selected item: "+itemIndex+" - "+item.text);
	    currentListItem=id('list').children[itemIndex];
	    currentListItem.children[0].style.backgroundColor='gray'; // highlight new selection
	    showDialog('controls',true);
    }
    else if(currentDialog==='controls') { // second click - shortcut to editing
        if(item.type%4===0) { // note item
            if(item.type==4) id(noteField.value=cryptify(item.text,keyCode));
            else id('noteField').value=item.text;
            showDialog('noteDialog',true);
        }
        else { // checklist item
            if(item.type>4) id('editItemField').value=cryptify(item.text,keyCode);
            else id('editItemField').value=item.text;
            showDialog('editItemDialog',true);
        }
    }
    else { // third click - deselect
        console.log("DESELECT");
	    showDialog('controls',false); // should close any open dialog
	    currentListItem.children[0].style.backgroundColor='black';
	    currentListItem=null;
    }
}

// MOVE ITEM UP
id('upButton').addEventListener('click', function() {
    if(itemIndex<1) return; // cannot if already at top
    console.log("move "+item.text+" up");
    // item=items[itemIndex];
    item.index--; // shift this item up
    var dbTransaction=db.transaction('items',"readwrite");
    var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    var getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.index--;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
    item=items[itemIndex-1]; // shift previous item down
    item.index++;
    getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.index++;
        putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
	showDialog('controls',false);
    populateList();
    itemIndex--;
    showControls();
})

// MOVE ITEM DOWN
id('downButton').addEventListener('click', function() {
    console.log("move "+item.text+" down - itemIndex: "+itemIndex);
    if((items.length-itemIndex)<2) return; // cannot if already last
    console.log("move "+item.text+" down");
    // item=items[itemIndex];
    item.index++; // shift this item down
    var dbTransaction=db.transaction('items',"readwrite");
    var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    var getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.index++;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
    item=items[itemIndex+1]; // shift previous item up
    item.index--;
    getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.index--;
        putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
	showDialog('controls',false);
    populateList();
    itemIndex++;
    showControls();
})
*/


// DELETE NOTE

/* DELETE CHECK
id('deleteButton').addEventListener('click',function() {
    console.log('delete? item '+itemIndex+': '+items[itemIndex].text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	if(items[itemIndex].type%2) { // check lists are empty before deleting
		console.log('list item so check for children');
		var itemID=items[itemIndex].id;
		var found=false;
		request=dbObjectStore.openCursor();
		request.onsuccess=function(event) {
			var cursor=event.target.result;
			if(cursor) {
				if(cursor.value.owner==itemID) found=true; // find any children
				cursor.continue ();
			}
			else {
				console.log("No more entries - found: "+found);
				if(found) { // list not empty - abort delete
					alert('can only delete empty lists');
					return;
				}
				else deleteItem(itemIndex);
			}
		}
	}
	else deleteItem(itemIndex);
})

// DELETE ITEM
function deleteItem(itemIndex) {
	console.log('go ahead and delete '+itemIndex);
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete item");
	for(var i=itemIndex+1;i<items.length;i++) { // decrement .index of following items
	    items[i].index--;
	    var getRequest=dbObjectStore.get(items[i].id);
        getRequest.onsuccess=function(event) {
            var data=event.target.result;
            data.index--;
            var putRequest=dbObjectStore.put(data);
		    putRequest.onsuccess=function(event) {
			    console.log('item '+item.index+" updated");
		    };
		    putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
        }
		getRequest.onerror=function(event) {console.log("error getting item to update "+item.index);};
	}
	for(i in items) console.log('item '+i+': '+items[i].text+' index: '+items[i].index);
	console.log('delete item '+itemIndex+' id: '+items[itemIndex].id);
	var delRequest=dbObjectStore.delete(items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
    showDialog('controls',false);
}
*/
// ADD ITEMS
function showAddDialog() {
    if(list.type>3) { // secure list items are secure
        id('secureChoice').checked=true;
        id('secureChoice').disabled=true;
    }
    else { // items only available at depth 1
        id('secureChoice').checked=false;
        id('secureChoice').disabled=false;
    }
    id('itemChoice').disabled=(depth<1)?true:false;
    id('listChoice').checked=true;
    showDialog('addDialog',true);
}

id('itemChoice').addEventListener('click', function() {
    console.log("click item");
    id('secureChoice').checked=false;
    id('secureChoice').disabled=true;
})

id('buttonNew').addEventListener('click', function(){
// id('addButton').addEventListener('click',function() {
    console.log('add item before item '+itemIndex+': '+items[itemIndex].text);
    // id('controls').style.display='none';
    if(depth<2 && list.type>0) { // list above depth 2 - can add sub-list
        // id('secureChoice').checked=(list.type>3);
        id('itemChoice').disabled=(depth<1);
        id('listChoice').checked=true;
        // id('addDialog').style.display='block';
        showDialog('addDialog',true);
    }
    else if(list.type%4==3) { // checklist - add checklist item
        console.log('checklist');
        id('addItemField').value='';
        showAddItemDialog();
    }
    else {
        console.log('note');
        item=null;
        id('noteField').value='';
        showDialog('noteDialog',true);
    }
})

id('cancelAddButton').addEventListener('click',function() {
    // id('addDialog').style.display='none';
    showDialog('addDialog',false);
})

id('confirmAddButton').addEventListener('click',function() {
    // alert('ADD');
    item={};
    item.owner=list.id;
    item.type=(id('listChoice').checked)?1:0;
    /*
    if(id('listChoice').checked) {
        item.type=1;
    }
    else { // *** set type to 0 for notes and 2 for checklist items
        item.type=(list.type==1)?0:2;
    }
    */
    console.log("item type: "+item.type);
    if(item.type<1) { // add note
        id('noteField').value='';
        showDialog('noteDialog',true);
    }
    else { // list or checklist
        id('addItemField').value='';
        showDialog('addItemDialog',true);
    }
})
    

function showAddItemDialog() {
    item={};
    item.owner=list.id;
    item.type=list.type-1;
    id('addItemField').value='';
    showDialog('addItemDialog',true);
}

id('cancelAddItemButton').addEventListener('click',function() {
    showDialog('addItemDialog',false);
})

id('confirmAddItemButton').addEventListener('click',function() {
	item.text=cryptify(id('addItemField').value,keyCode);
    console.log("add "+item.text+' type: '+item.type);
    // add new item;
    console.log("update list "+list.id);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    item.index=items.length;
    items.push(item);
    var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		item.id=event.target.result;
		console.log("new item added - id is "+item.id);
	};
	addRequest.onerror=function(event) {console.log("error adding new item");};
    showDialog('addItemDialog',false);
    itemIndex=null;
    currentListItem=null;
    populateList(); // DECRYPT?
})

/* EDIT ITEM
id('editButton').addEventListener('click',function() {
    item=items[itemIndex];
    console.log('edit item '+itemIndex+": "+item.text+' type: '+item.type);
	id(editItemField.value=cryptify(item.text,keyCode));
    showDialog('editItemDialog',true);
})
*/

// LIST 
id('cancelItemButton').addEventListener('click',function() {
    showDialog('editItemDialog',false);
})

id('confirmItemButton').addEventListener('click', function() {
    if(item.type>3) item.text=cryptify(id('editItemField').value,keyCode);
    else item.text=id('editItemField').value;
    console.log('edit to '+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.text=item.text;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
			showDialog('editItemDialog',false);
        	populateList(); // DECRYPT?
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
	/* move into putRequest.onsuccess, above
	showDialog('editItemDialog',false);
	populateList();
	*/
})

id('deleteItemButton').addEventListener('click',function() {
	if(items.length<1) console.log('DELETE LIST');
	else alert('CAN ONLY DELETE EMPTY LISTS');
})

// NOTE
id('cancelNoteButton').addEventListener('click',function() {
    showDialog('noteDialog',false);
})

id('deleteNoteButton').addEventListener('click', function() {
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete item");
	console.log('delete item '+itemIndex+' id: '+items[itemIndex].id);
	var delRequest=dbObjectStore.delete(items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
    // showDialog('controls',false);
})

id('confirmNoteButton').addEventListener('click', function() {
    if(item===null) {
        item={};
        item.owner=list.id;
        item.type=list.type-1;
    }
    if(item.type>3) item.text=cryptify(id('noteField').value,keyCode);
    else item.text=id('noteField').value;
    console.log("note content: "+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	console.log('item.id: '+item.id+' itemIndex: '+itemIndex);
    if(item.id) { // editing existing note item
        var getRequest=dbObjectStore.get(item.id);
        getRequest.onsuccess=function(event) {
            var data=event.target.result;
            data.text=item.text;
            var putRequest=dbObjectStore.put(data);
	        putRequest.onsuccess=function(event) {
			    console.log('item '+item.index+" updated");
		    };
		    putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
        }
        getRequest.onerror=function(event) {console.log("error getting item to update "+item.index);}
        items[item.index].text=item.text;
    }
    else {
        if(currentListItem) { // inserting new note item
            for(var i=itemIndex;i<items.length;i++) { // increment .index of following items
                items[i].index++;
                var getRequest=dbObjectStore.get(items[i].id);
                getRequest.onsuccess=function(event) {
                    var data=event.target.result;
                    data.index++;
                    var putRequest=dbObjectStore.put(data);
		            putRequest.onsuccess=function(event) {
		    	        console.log('item '+item.index+" updated");
		            };
		            putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
                }
		        getRequest.onerror=function(event) {console.log("error getting item to update "+item.index);};
            }
            item.index=itemIndex;
            items.splice(itemIndex,0,item);
        }
        else { // no item selected - add at end of list
            item.index=items.length; // *** OR INSERT INTO ITEMS
            items.push(item);
        }
        var addRequest=dbObjectStore.add(item);
	    addRequest.onsuccess=function(event) {
		    items[item.index].id=item.id=event.target.result;
		    console.log("new item added - id is "+item.id);
	    }
	    addRequest.onerror=function(event) {console.log("error adding new item");};
    }
    showDialog('noteDialog',false);
    itemIndex=null;
    currentListItem=null;
    populateList(); // DECRYPT?
})

// KEY INPUT
id('confirmKeyButton').addEventListener('click', function() {
    console.log("keyCode: "+keyCode+" check: "+id('keyCheck').value+" input: "+id('keyField').value);
    var k=id('keyField').value;
    if(keyCode===null) { // set keyCode - step 1
        // keyCode=id('keyField').value;
        // if(keyCode.length<4) {
        if(k.length<4) {
            alert('4 digits or more');
            return;
        }
        id('keyCheck').value=keyCode=k;
        id('keyTitle').innerHTML='confirm key';
        id('keyField').value='';
        id('keyLabel').innerHTML='confirm';
        return;
    }
    else if(k==id('keyCheck').value) { // set keyCode step 2 or unlock
        window.localStorage.keyCode=cryptify(k,'secrets');
        unlocked=true;
        id('keyLabel').innerHTML='unlock';
        showDialog('keyDialog',false);
        return true;
    }
    else keyCode=null;
    showDialog('keyDialog',false);
    console.log("key is "+keyCode);
    return false;
})

id('cancelKeyButton').addEventListener('click', function() {
    showDialog('keyDialog',false);
})

// POPULATE LIST
function populateList(decrypt) {
    var listItem;
    id("list").innerHTML=""; // clear list
	console.log("populate list for path "+path+" with "+items.length + " items - depth: "+depth);
	if(path.length<1)
    id('heading').innerHTML=list.name;
	else {
	    id('heading').innerHTML=path[0];
	    var i=1;
	    while(i<path.length) {
	        id('heading').innerHTML+='.'+path[i++];
	    }
	}
	if(decrypt) for(i in items) {
		items[i].text=cryptify(items[i].text,keyCode);
		console.log('item '+i+': '+items[i].text);
	}
	items.sort(function(a,b){
		if(a.text<b.text) return -1;
		if(a.text>b.text) return 1;
		return 0;
	}); // sort alphabetically
	for(var i in items) {
	    console.log('add item '+i+': '+items[i].text+' type '+items[i].type);
	    // all items have text
		listItem=document.createElement('li');
		listItem.index=i;
	 	listItem.innerText=items[i].text;
		if(items[i].type>0) { // tap on list to open it
		    listItem.addEventListener('click',function() {
	 	    	itemIndex=this.index;
	 	    	console.log('open item '+itemIndex);
		    	list.id=items[this.index].id;
		    	list.type=items[this.index].type;
		    	list.name=items[this.index].text;
		    	list.owner=items[this.index].owner;
		    	if(!keyCheck()) return; // require key to open ********* NO LONGER NEEDED - GET PIN AT START ********
		    	console.log('open list '+list.name+' id:'+list.id+' type:'+list.type+' owner: '+list.owner);
		    	depth++;
		    	path.push(list.name);
		    	loadListItems();
	 		});
		    listItem.style.fontWeight='bold'; // lists are bold
		}
		else { // tap on note to edit it
			listItem.addEventListener('click',function() {
				itemIndex=this.index;
				id('noteField').innerText=items[i].text;
				showDialog('noteDialog',true);
			})
		}
		id('list').appendChild(listItem);
	}
}

function checkItem(n) {
    items[n].checked=!items[n].checked;
    console.log(items[n].text+" checked is "+items[n].checked);
    // update database
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var getRequest=dbObjectStore.get(items[n].id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.checked=items[n].checked;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+items[n].text+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item[n].text);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
}

// LOAD LIST ITEMS
function loadListItems() {
	//  load children of list.id
	console.log("load children of list.id "+list.id+" - depth: "+depth+' owner: '+list.owner);
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var item={};
	if(list.id!==null) {
		console.log("get list item "+list.id);
		var request=dbObjectStore.get(list.id);
		request.onsuccess=function() {
			item=event.target.result;
			console.log("list item "+item.text+"; type: "+item.type+"; owner: "+item.owner);
			// var t=item.text;
			// if(item.secure>0) t=cryptify(t,keyCode);
			list.name=cryptify(item.text,keyCode);
			list.type=item.type; // types 1-3 only
		};
		request.onerror=function() {console.log("error retrieving item "+list.id);}
	}
	else {
	    list.name="Lists";
	    list.type=1;
	}
	items=[];
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		var cursor=event.target.result;
		if(cursor) {
			if(cursor.value.owner==list.id) { // just items in this list
				if(cursor.value.type>3) cursor.value.type-=4;
				items.push(cursor.value);
				console.log("item id: "+cursor.value.id+"; index: "+cursor.value.index+"; "+cursor.value.text+"; type: "+cursor.value.type+"; owner: "+cursor.value.owner);
			}
			cursor.continue ();
		}
		else {
			console.log("No more entries! "+items.length+" items");
			if(list.id===null) { // backup checks
				/* temporary code to remove wrongly numbered data
				if(items[0].id<1) {
					alert('CORRUPTED DATA: CLEAR DATABASE');
					request=dbObjectStore.clear();
				}
				*/
				if(items.length<1) { // no data: restore backup?
				    console.log("no data - restore backup?");
				    // document.getElementById('importDialog').style.display='block';
				    showDialog('importDialog',true);
				}
				else { // monthly backups
				    var today=new Date();
				    console.log('this month: '+today.getMonth()+"; last save: "+lastSave);
				    if(today.getMonth()!=lastSave) backup();
				}
			}
			populateList(true);
		}
	}
}

// RESTORE BACKUP
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var items=json.items;
		console.log(items.length+" items loaded");
		var dbTransaction=db.transaction('items',"readwrite");
		var dbObjectStore=dbTransaction.objectStore('items');
		for(var i=0;i<items.length;i++) {
			console.log("save "+items[i].text);
			var request=dbObjectStore.add(items[i]);
			request.onsuccess=function(e) {
				console.log(items.length+" items added to database");
			};
			request.onerror=function(e) {console.log("error adding item");};
		}
		showDialog('importDialog',false);
		alert("backup imported - restart");
  	});
  	fileReader.readAsText(file);
});

// CANCEL RESTORE
id('cancelImportButton').addEventListener('click', function() {
    showDialog('importDialog',false);
});

// BACKUP
function backup() {
  	console.log("EXPORT");
	var fileName="secrets";
	var date=new Date();
	fileName+=date.getFullYear();
	fileName+=(date.getMonth()+1);
	fileName+=date.getDate()+".json";
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var request=dbObjectStore.openCursor();
	var items=[];
	dbTransaction=db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    		if(cursor) { // read in every item
			    items.push(cursor.value);
			    cursor.continue();  
    		}
		else {
			console.log(items.length+" items - save");
			var data={'items': items};
			var json=JSON.stringify(data);
			var blob=new Blob([json], {type:"data:application/json"});
  			var a=document.createElement('a');
			a.style.display='none';
    		var url=window.URL.createObjectURL(blob);
			console.log("data ready to save: "+blob.size+" bytes");
   			a.href=url;
   			a.download=fileName;
    		document.body.appendChild(a);
    		a.click();
			alert(fileName+" saved to downloads folder");
			var today=new Date();
			lastSave=today.getMonth();
			window.localStorage.setItem('lastSave',lastSave); // remember month of backup
		}
	}
}

// ENCRYPT/DECRYPT TEXT USING KEY
function cryptify(value,key) {
	var i=0;
	var result="";
	// console.log("cryptify "+value+" using key "+key);
	var k;
	var v;
	for (i=0;i<value.length;i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		// console.log("key["+i+"]: "+k+"; value["+i+"]: "+v);
		result+=String.fromCharCode(k ^ v);
		// console.log("result: "+result);
	}
	return result;
};

// KEY CHECK
function keyCheck() {
    console.log('KEY CHECK');
    if(unlocked) return true;
    id('keyTitle').innerText='enter key';
    id('keyField').value='';
    id('keyCheck').value=keyCode;
    id('keyLabel').innerText='unlock';
    showDialog('keyDialog',true);
}

// START-UP CODE
lastSave=window.localStorage.getItem('lastSave');
keyCode=window.localStorage.keyCode; // load any saved key
console.log("last save: "+lastSave+"; saved key: "+keyCode);
if(!keyCode) { // first use - set a PIN
    keyCode=null;
    id('keyTitle').innerHTML='set a key';
    id('keyLabel').innerHTML='next';
    showDialog('keyDialog',true);
}
else { // start-up - enter PIN
	keyCode=cryptify(keyCode,'secrets'); // saved key was encrypted
	alert("decoded keyCode: "+keyCode);
	id('keyTitle').innerText='enter key';
    id('keyField').value='';
    id('keyCheck').value=keyCode;
    id('keyLabel').innerText='unlock';
    showDialog('keyDialog',true);
}
// load items from database
var request=window.indexedDB.open("slaaneshDB");
request.onsuccess=function (event) {
	db=event.target.result;
	console.log("DB open");
	var dbTransaction=db.transaction('items','readwrite');
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	var request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		list.id=list.owner=null;
		loadListItems();
	};
};
request.onupgradeneeded=function(event) {
	var dbObjectStore=event.currentTarget.result.createObjectStore("items",{
		keyPath:'id',autoIncrement: true
	});
	console.log("items database ready");
}
request.onerror=function(event) {
	alert("indexedDB error code "+event.target.errorCode);
};
	
// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('slaaneshSW.js', {
		scope: '/slaanesh/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}