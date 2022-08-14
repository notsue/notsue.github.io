// haha.js: version 0.4

const Short = {
	// short attribute-names
	c: 'class',
	i: 'id',
	h: 'href',
	t: 'title',
	s: 'src',
	a: 'alt',
	l: 'lang',
	p: 'property' // RDFa
}
const shortKeys = Object.keys(Short);

const Boolean = ['allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default', 'defer', 'disabled', 'formnovalidate', 'ismap', 'itemscope',
				 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected', 'truespeed' ]

class Element {
	name;
	parent;
	html = '';
	tagname;
	openTag;
	closeTag;
	child = null;

	constructor(tag, parent) {
		this.tag = tag;
		this.parent = parent;
		if (tag == 'dummy') {
			this.openTag = '';
			this.closeTag = '';
		} else {
			// attributes
			let atts = tag.split(',');
			let attsStr = "";
			let attname = "";
			let attvalue = "";
			tag = atts[0];
			// Tufte sidenote
			if (tag == '[SN') {
				let id = atts[1];
				this.html += '<label class="margin-toggle sidenote-number"  for="' + id + '"></label><input type="checkbox" class="margin-toggle" id="' + id + '"></input>';
				tag = '[span';
				atts[0] = '[span';
				atts[1] = 'sidenote';
			} 
			// Tufte margin note
			if (tag == '[MN') {
				let id = atts[1];
				this.html += '<label class="margin-toggle"  for="' + id + '">&#8314;</label><input type="checkbox" class="margin-toggle" id="' + id + '"></input>';
				tag = '[span';
				atts[0] = '[span';
				atts[1] = 'marginnote';
			} 
			
			if (tag == '[FN') {
				tag = '[span';
				atts[0] = '[span';
				atts[1] = 'haha-fn';
			}
			
			if (atts.length > 1) {
				for (let i = 1; i < atts.length; i++) {
					let nameValue = atts[i].split('=');
					if (nameValue.length < 2) { // nameless attributes
						if (tag == '[a') {
							nameValue = ['href', nameValue[0]];
						} else if (tag == '[img') {
							nameValue = ['src', nameValue[0]];
						}	else {
							nameValue = ['class', nameValue[0]];
						}
						
					}
					if (nameValue[0] == 'B') { // Boolean values
						attsStr += ' ' + nameValue[1];
						
					} else {
						if (shortKeys.indexOf(nameValue[0]) > -1) {
							attname = Short[nameValue[0]];
						} else {
							attname = nameValue[0]
						}
						
						if (attname == 'action' || attname == 'src' || attname == 'href' || attname == 'id' || attname == 'cite'){ // do not replace _ by whitespave
							attvalue = nameValue[1];
						} else {
							attvalue = nameValue[1].split('_').join(' ')
						}
						attsStr += ' ' + attname + '="' + attvalue + '"';
					}
				}
			}	
			
			if (tag == '[') {
			   if (parent.tagname == 'tr' ) {
				  this.tagname = 'td';
			   } else if (parent.tagname == 'ol' || parent.tagname == 'ul' ) {
				   this.tagname = 'li';	
			   } else {
				   this.tagname = 'p'
			   }
			} else {
				this.tagname = tag.substr(1)
			}
			
			this.openTag = '<' + this.tagname + attsStr + '>'
			// console.log(this.openTag)
			this.closeTag = '</' + this.tagname + '> '
		}
		this.html += this.openTag
	}
	
	add(str) {
	    if (str.startsWith('[')) {
			this.child = new Element(str, this);
		
		} else if (str.startsWith(']')) {
			this.html += this.closeTag;
			this.html = this.html.split(' </').join('</') // tidy html
			this.parent.add(this.html);
			this.parent.child = null
		} else {
			this.html += str + ' ';
		}
	}
	
	append(str) {
		if (this.child == null) {
			this.add(str)
		} else {
			this.child.append(str)
		}
	}
		
}

function docReady(fn) {
	// hack from stackoverflow
	// see if DOM is already available
	if (document.readyState === "complete" || document.readyState === "interactive") {
		// call on next available tick
		setTimeout(fn,1);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

docReady(function() {
	
	console.log('script haha')
	
	let pre = document.getElementsByTagName('pre');
	const pre2 = Object.assign({},pre); // hard copy
	
	for (let i = 0; i < pre.length; i++) {
		pre[i].outerHTML = '[pre ]';
	}
	/* remove content of script-elements */
	let scripts = document.getElementsByTagName('script');
	for (let i = 0; i < scripts.length; i++) {
		scripts[i].innerHTML = '';
	}
	
	
	let body = document.getElementsByTagName('body');
	let bodyHH = body[0].innerHTML;
	//console.log(bodyHH);
	let lines = bodyHH.split(/\r\n|\r|\n/g);
	let content2 = "";
	for (let i = 0; i < lines.length; i++) {
		content2 += lines[i].trim() + ' ';
	}
	content2 = content2.split('\\[').join('&#91;'); // escape brackets
	content2 = content2.split('\\]').join('&#93;');
	content2 = content2.split(']').join(' ] '); // sugar
	
	// split up in 'words'
	clist = content2.split(" ");
		
	let html = new Element('dummy', null);
	for (let i = 0; i < clist.length; i++) {
		txt = clist[i].trim();
		html.append(txt);
	}
	body[0].innerHTML = html.html;
	let preEmpty = body[0].getElementsByTagName('pre');
	for (let i = 0; i < preEmpty.length; i++) {
		preEmpty[i].innerHTML = pre2[i].innerHTML;
	}
	
	/* evaluate all scripts */
	//for (let i = 0; i < scripts.length; i++) {
	//	eval(scripts[i].innerHTML);
	//}
	
	// footnotes: collects elements <span class="haha-fn">
	// shows in <div id="haha-footnotes"></div>, with numbers and backlinks
	
	let F = document.getElementById('haha-footnotes');
	if (F == null) {
		console.log('NO ELEMENT OF CLASS "haha-footnotes"')
	} else {
		let footnotes = document.getElementsByClassName('haha-fn');
		let fn = "<ol>\n"
		for (let i = 0; i < footnotes.length; i++){
			fn += '<li class="haha-fn-item" id="haha-fn-' + (i + 1) + '">' + footnotes[i].innerHTML + '<a class="haha-backlink" href="#haha-fn-back-' + (i + 1) + '">' +  '⮍</a></li>\n';
			footnotes[i].innerHTML = '<a id="haha-fn-back-' + (i + 1) + '" href="#haha-fn-' + (i + 1) + '">[' + (i + 1) + ']</a>'
		}
		fn += '</ol>'
		F.innerHTML = fn
		// console.log(fn)
	}
	
	// Creating table of contents
	// example: <div id="haha-toc">h2,h3</div>
	let T = document.getElementById('haha-toc');
	if (T == null) {
		console.log('NO ELEMENT OF CLASS "haha-toc"')
	} else {
		
		let keep = T.innerHTML.split(','); // our example ['h2','h3']
		for (let i = 0; i < keep.length; i++) {
			keep[i] = keep[i].trim()
		}
		//console.log(keep)
		if (keep[0] == "") {
			console.log("ALL HEADERS IN TOC? NO SELECTION in ELEMENT 'haha-toc'");
			keep = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
		};
		// give all headers class-value 'haha-hn'
		let headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
		for (let i = 0; i < headers.length; i++) {
			let hn = document.getElementsByTagName(headers[i]);
			//console.log(hn)
			for (let j = 0; j < hn.length; j++) {
				hn[j].classList.add('haha-hn')
			}
		}
		// collect all headers
		let see = document.getElementsByClassName('haha-hn');
		// add to toc as  indicated in array keep
		let toc = ""
		for (let i = 0; i < see.length; i++) {
			// console.log(see[i].tagName);
			let tagname = see[i].tagName.toLowerCase()
			if (keep.indexOf(tagname) > -1) {
				toc += '<p class="haha-' + tagname + '"><a href="#haha-header-' + i + '">' + see[i].innerHTML + '</a></p>\n';
				see[i].setAttribute('id', 'haha-header-' + i)
			}
		}
		//console.log('\nTOC\n\n', toc)
		T.innerHTML = toc;
	}
	
});
