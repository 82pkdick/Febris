/**
 * table-expansion.js
 *  Extend the look of the table.
 *  Add cell concatenation, vertical header.
 * 
 * vertical header (_.)
 * colspan (\num.)
 * rowspan (/num.)
 * unnecessary cell (^)
 * 
 * sample table
{:.bordered .extended}
| Header1       |\2. Column 0-1  |^               |
| :-----------: | :-----------   | :------------  |
|_. Header2     | Column 1-1     | Column 1-2     |
|_.\2. Header3  |^               |/2.  Column 2-2 |
|_./3. Header4  | Column 3-1     |^               |
|^              | Column 4-1     | Column 2-2     |
|^              | Column 5-1     | Column 3-2     |
 * 
 */

;(function(global) {

let split_celltxt = function(txtnode) {
  return txtnode.split('.');
};

let get_text_content = function(cell) {
  return cell.textContent.trim();
};

let get_setting = function(cell) {
  return split_celltxt(get_text_content(cell));
};

// header cell '_'
let is_header = function(token) {
  let notation = '_';
  if (token == notation) {
    return true;
  } else { 
    return false; 
  }
}

// Test whether cell has the attribute of colspan or rowspan.
let test_span = function(notation, token) {
  let match;
  if (notation.test(token)) {
    match = token.match(notation);
    return match[1];
 } else { 
   return false; 
 }
};

// colspan cell '\num'
let is_colspan = function(token) {
  let notation = /\\([0-9])/;
  return test_span(notation, token);
};

// rowspan cell '/num'
let is_rowspan = function(token) {
  let notation = /\/([0-9])/;
  return test_span(notation, token);
};

// Read cell node and set attribute value.
let set_cellspec = function(cell) {
  let set = [], ret, token;
  set = [cell, 0,0,0,0,0] 
  token = get_setting(cell);
  if (is_header(token[0])) { 
    set[1] = 1;
    token.shift();
  }
  if (is_colspan(token[0])) {
    ret = is_colspan(token[0]);
    set[2] = 1;
    set[3] = ret;
    token.shift();
  } else if (is_rowspan(token[0])) {
    ret = is_rowspan(token[0]);
    set[4] = 1;
    set[5] = ret;
    token.shift();
  }
  token = [token.join('.')];
  set[6] = token[0].trim();

  return set;
};

let extract_class_name = function(str) {
  let res, cell_text, result;
  // let ptn = /{:\s*\.(\w+)}/;
  let ptn = /{:\s*\.(\w+(\s*\.\w+)*)}/;

  res = str.match(ptn);
  // console.log(res);
  if (res) {
    cell_text = str.replace(ptn, '');
    result = [cell_text, res[1]]
    return result;
  } else {
    return false;
  }
};

// extract_class_name('Header1 {: .test1 .test2 .test3}');

let process_class_name = function(text) {
  let res = extract_class_name(text);
  if (res) {
    return res;
  } else {
    return false;
  }
};

let process_class_list = function(c_name) {
  let ret = c_name.split('.').map(function(el){ 
    return el.trim(); 
  })
  return ret;
};

// Generate a new header cell.
let gen_new_th = function(el) {
  let th, cell_style = '', span_num;
  let cell_text = '', class_name;
  th = document.createElement('th');
  if (el.hasAttribute('style')) {
    cell_style = el.getAttribute('style');
    th.setAttribute('style', cell_style);
  }
  if (el.hasAttribute('colspan')) {
    span_num = el.getAttribute('colspan');
    th.setAttribute('colspan', span_num);
  }
  if (el.hasAttribute('rowspan')) {
    span_num = el.getAttribute('rowspan');
    th.setAttribute('rowspan', span_num);
  }
  if (el.hasAttribute('class')) {
    class_name = el.getAttribute('class');
    th.classList.add(class_name);
  }
  cell_text = el.textContent;
  if (cell_text != '') {
    th.textContent = cell_text;
  }
  return th;
};

// -----------------------------------------------------------
/* Read the entire table of documents */
const tbls = document.getElementsByTagName('table');

/*
 cell_settings = [
   [
    [0]: node,
    [1]: is header,
    [2]: is colspan,
    [3]: colspan number,
    [4]: is rowspan,
    [5]: rowspan number,
    [6]: cell textContent
   ],
   .....]
 */

/**
  Process the cell based on the set attribute.
*/
Array.from(tbls).forEach(function(tbl) {
  let ths = [], tds = [];
  let cell_settings = [];

  if (tbl.classList.contains("extended")) {
    ths = tbl.querySelectorAll("th");
    tds = tbl.querySelectorAll("td");
  } else {
    return;
  }

  if (ths.length > 0) {
    for (let i=0; i<ths.length; i++) {
      cell_settings.push(set_cellspec(ths[i]));
    }
  }

  if (tds.length > 0) {
    for (let i=0; i<tds.length; i++) {
      cell_settings.push(set_cellspec(tds[i]));
    }
  }

  cell_settings.forEach(function(set){
    let th, colspan, rowspan, tnode_res, class_name;
    th = false; 
    colspan = false; 
    rowspan = false;
    let cell = set[0];
    if (set[1] == 1) { th = true; }
    if (set[2] == 1) { colspan = true; }
    if (set[4] == 1) { rowspan = true; }

    if (colspan) {
      cell.setAttribute('colspan', set[3]);
    }
    if (rowspan) {
      cell.setAttribute('rowspan', set[5]);
    }

    tnode_res = process_class_name(set[6]);
    if (tnode_res) {
      cell.textContent = tnode_res[0];
      class_name = process_class_list(tnode_res[1]);
      class_name.forEach(function(cl){
        cell.classList.add(cl);
      });
    } else {
      cell.textContent = set[6];
    }

    if (th) {
      th = gen_new_th(cell, set);
      cell.replaceWith(th);
    }

    if (set[6] == '^') {
      cell.parentNode.removeChild(cell);
    }

  });
});

})(window);