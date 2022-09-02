/**
 * Smart but ruthless wikitext normalization
 * Insipired in https://standardjs.com/
 * Enough of this madness!
 */
var Normalizer = {

	/**
	 * Normalize the wikitext
	 */
	normalize: function ( wikitext ) {

		// Due to nested templates, tables and links, simple regexes are not enough
		var start, depth, position, string;

		/**
		 * Templates
		 */
		start = wikitext.indexOf( '{{' );
		while ( start > -1 ) {
			depth = 0;
			for ( position = start; position < wikitext.length; position++ ) {
				if ( wikitext.substring( position, position + 2 ) === '{{' ) {
					position++;
					depth++;
				}
				if ( wikitext.substring( position, position + 2 ) === '}}' ) {
					position++;
					depth--;
				}
				if ( ! depth ) {
					break;
				}
			}
			string = wikitext.substring( start, position + 1 );
			wikitext = wikitext.replace( string, Normalizer.normalizeTemplate );
			start = wikitext.indexOf( '{{', position ); // Find the next
		}

		/**
		 * Tables
		 */
		start = wikitext.indexOf( '{|' );
		while ( start > -1 ) {
			depth = 0;
			for ( position = start; position < wikitext.length; position++ ) {
				if ( wikitext.substring( position, position + 2 ) === '{|' ) {
					position++;
					depth++;
				}
				if ( wikitext.substring( position, position + 2 ) === '|}' ) {
					position++;
					depth--;
				}
				if ( ! depth ) {
					break;
				}
			}
			string = wikitext.substring( start, position + 1 );
			wikitext = wikitext.replace( string, Normalizer.normalizeTable );
			start = wikitext.indexOf( '{|', position ); // Find the next
		}

		/**
		 * Links
		 */
		start = wikitext.indexOf( '[[' );
		while ( start > -1 ) {
			depth = 0;
			for ( position = start; position < wikitext.length; position++ ) {
				if ( wikitext.substring( position, position + 2 ) === '[[' ) {
					position++;
					depth++;
				}
				if ( wikitext.substring( position, position + 2 ) === ']]' ) {
					position++;
					depth--;
				}
				if ( ! depth ) {
					break;
				}
			}
			string = wikitext.substring( start, position + 1 );
			wikitext = wikitext.replace( string, Normalizer.normalizeLink );
			start = wikitext.indexOf( '[[', position ); // Find the next
		}

		/**
		 * References
		 */
		// References before punctuation
		wikitext = wikitext.replace( /<ref([^<]+)<\/ref>([.,;:])/g, '$2<ref$1</ref>' );
		wikitext = wikitext.replace( /<ref([^>]+)\/>([.,;:])/g, '$2<ref$1/>' );

		// Names with extra spaces
		wikitext = wikitext.replace( /<ref +name += +/g, '<ref name=' );

		// Names without quotes
		wikitext = wikitext.replace( /<ref name=' +([^']+) +'/g, '<ref name="$1"' );
		wikitext = wikitext.replace( /<ref name=([^" \/>]+)/g, '<ref name="$1"' );

		// No space before the closing slash
		wikitext = wikitext.replace( /<ref([^>]+[^ ]+)\/>/g, '<ref$1 />' );

		// Spaces between punctuation and references
		wikitext = wikitext.replace( / *([.,;:]) *<ref/g, '$1<ref' );

		// Spaces or newlines after opening ref tag
		wikitext = wikitext.replace( /<ref([^>\/]*)>[ \n]+/g, '<ref$1>' );

		// Spaces or newlines before any ref tag
		wikitext = wikitext.replace( /[ \n]+<\/?ref/g, '<ref' );

		// Empty references
		wikitext = wikitext.replace( /<ref name="([^"]+)"><\/ref>/g, '<ref name="$1" />' );
		wikitext = wikitext.replace( /<ref>><\/ref>/g, '' );

		/**
		 * Lists
		 */
		// List items with wrong characters
		wikitext = wikitext.replace( /^[•-]/gm, '*' );

		// Number items with wrong characters
		wikitext = wikitext.replace( /^\d\./gm, '#' );

		// Empty list items
		wikitext = wikitext.replace( /^([*#]+) *\n/gm, '' );

		// List items with no initial space
		wikitext = wikitext.replace( /^([*#]+)/gm, '$1 ' );

		// List items with extra newlines
		wikitext = wikitext.replace( /^\n+([*#]+)/gm, '$1' );

		// Lists with no initial extra newline
		wikitext = wikitext.replace( /^([^*#][^\n]+)\n([*#])/gm, '$1\n\n$2' );

		// Lists with no trailing extra newline
		wikitext = wikitext.replace( /^([*#][^\n]+)\n([^*#])/gm, '$1\n\n$2' );

		/**
		 * Sections
		 */
		// Spacing
		wikitext = wikitext.replace( /^(=+) *(.+?) *(=+) *$/gm, '\n\n$1 $2 $3\n\n' );

		// Bold in section titles
		wikitext = wikitext.replace( /^(=+) '''(.+?)''' (=+)$/gm, '$1 $2 $3' );

		// Colon in section titles
		wikitext = wikitext.replace( /^(=+) (.+?): (=+)$/gm, '$1 $2 $3' );

		/**
		 * Spacing
		 */
		// Tabs in code blocks
		wikitext = wikitext.replace( /^  {8}/gm, ' \t\t\t\t' );
		wikitext = wikitext.replace( /^  {6}/gm, ' \t\t\t' );
		wikitext = wikitext.replace( /^  {4}/gm, ' \t\t' );
		wikitext = wikitext.replace( /^  {2}/gm, ' \t' );

		// Remaining tabs
		wikitext = wikitext.replace( / {4}/g, '\t' );

		// Broken character?
		wikitext = wikitext.replace( '​', ' ' );

		// Double spaces
		wikitext = wikitext.replace( /  +/g, ' ' );

		// Trailing spaces
		wikitext = wikitext.replace( /^ $/gm, '@@@' ); // Exception for code blocks
		wikitext = wikitext.replace( / +$/gm, '' );
		wikitext = wikitext.replace( /^@@@$/gm, ' ' );

		// Punctuation marks
		wikitext = wikitext.replace( / \./gm, '.' );
		wikitext = wikitext.replace( / ,/gm, ',' );
		wikitext = wikitext.replace( / :/gm, ':' );
		wikitext = wikitext.replace( / \)/gm, ')' );
		wikitext = wikitext.replace( /\( /gm, '(' );
		wikitext = wikitext.replace( /« /gm, '«' );
		wikitext = wikitext.replace( / »/gm, '»' );

		// Line breaks
		wikitext = wikitext.replace( / *<br ?\/?> */g, '<br>' );

		// Triple newlines
		wikitext = wikitext.replace( /^\n\n+/gm, '\n' );

		// Initial newlines
		wikitext = wikitext.replace( /^\n+/, '' );

		// Trailing newlines
		wikitext = wikitext.replace( /\n+$/, '' );

		/**
		 * Quotes
		 */
		// Single quotes
		wikitext = wikitext.replace( /[’‘]/g, "'" );

		// Double quotes
		wikitext = wikitext.replace( /[“”]/g, '"' );

		// Return the normalized wikitext
		return wikitext;
	},

	normalizeLink: function ( string, offset, wikitext ) {

		// Remove the outer braces
		var content = string.replace( /^\[\[/, '' ).replace( /\]\]$/, '' );

		// Replace underscores for spaces: [[Some_link]]
		content = content.replace( /_/g, ' ' );

		// Decode characters that shouldn't be encoded
		content = decodeURI( content );

		// Normalize namespace
		var normalizedNamespaces = mw.config.get( 'wgFormattedNamespaces' ),
			colon = content.indexOf( ':' );
		if ( colon ) {
			var namespace = content.substring( 0, colon ).toLowerCase().replace( / /g, '_' ),
				namespaceIds = mw.config.get( 'wgNamespaceIds' );
			for ( var namespaceKey in namespaceIds ) {
				if ( namespaceKey === namespace ) {
					var namespaceId = namespaceIds[ namespaceKey ],
						normalizedNamespace = normalizedNamespaces[ namespaceId ];
					content = normalizedNamespace + content.substring( colon );
					break;
				}
			}
		}

		var parts = content.split( '|' ),
			title = parts[0].trim(),
			rest = parts.slice(1);
			fileNamespace = normalizedNamespaces[6],
			categoryNamespace = normalizedNamespaces[14];

		// File link: [[File:Apple.jpg|thumb|This is an [[apple]].]]
		if ( title.startsWith( fileNamespace + ':' ) ) {
			content = title;
			rest.forEach( function ( param ) {
				param = param.trim();
				param = param.replace( /\[\[[^\]]+\]\]/g, Normalizer.normalizeLink );
				content += '|' + param;
			});

			// Remove redundant parameters
			content = content.replace( 'thumb|right', 'thumb' );
			content = content.replace( 'right|thumb', 'thumb' );
			content = content.replace( '|alt=|', '|' );

			// Give standalone files some room
			if ( wikitext.substring( offset-1, offset ) === '\n' ) {
				return '\n\n[[' + content + ']]\n\n';
			}

		// Link with alternative text: [[Title|text]]
		} else if ( rest[0] ) {
			text = rest[0].trim();
			title = title.charAt(0).toUpperCase() + title.slice(1);

			// Normalize [[Title|title]] to [[title]]
			if ( text.toLowerCase() === title.toLowerCase() ) {
				content = text;

			// Normalize [[Category:Test|Title of the page]] to [[Category:Test]]
			} else if ( title.startsWith( categoryNamespace + ':' ) && text.toLowerCase() === mw.config.get( 'wgTitle' ).toLowerCase() ) {
				content = title;

			// Else just build the link
			} else {
				content = title + '|' + text;
			}

		// Plain link: [[link]]
		} else {
			content = title;
		}

		// Restore the outer braces
		return '[[' + content + ']]';
	},

	normalizeTemplate: function ( string, offset, wikitext ) {

		// Remove the outer braces
		var content = string.replace( /^\{\{ ?/, '' ).replace( /\}\}$/, '' );

		// Capitalize the template name
		content = content.charAt(0).toUpperCase() + content.slice(1);

		if ( /\n/.exec( content ) ) {
			content = content.replace( / *\| */g, '| ' );
			content = content.replace( /^ ?\|([^=]+)=/gm, '| $1 = ' ); // Don't match = signs inside URL query strings
			//content = content.replace( /\n\| [^=]+= (\n[|}])/g, '$1' ); // Remove empty parameters @note Requires lookahead
		} else {
			content = content.replace( / *\| */g, '|' );
			content = content.replace( / *= */g, '=' );
			content = content.replace( /\|[^=]+=($|\|)/g, '$1' ); // Remove empty parameters
		}

		// Give standalone templates some room
		if ( wikitext.substring( offset-1, offset ) === '\n' ) {
			return '\n\n{{' + content + '}}\n\n';
		}

		return '{{' + content + '}}';
	},

	normalizeTable: function ( string, offset, wikitext ) {
		string = string.replace( /\n\n+/g, "\n" ); // Remove multiple newlines
		string = string.replace( /\!\!/g, "\n!" ); // Flatten the table
		string = string.replace( /\|\|/g, "\n|" );
		string = string.replace( /\n([|!][-+}]?)/g, "\n$1 " ); // Fix spacing
		string = string.replace( /\n[|!]\+? *'''(.*)'''/g, "\n! $1" ); // Fix pseudo-headers
		string = string.replace( /<\/?center>/g, '' ); // Remove <center> tags
		string = string.replace( /(\{\|[^\n]*\n)\|\-\n/g, "$1" ); // Remove leading newrow
		string = string.replace( /\|\-\n\|\}/g, "|}" ); // Remove trailing newrow
		string = string.replace( /\{\|[^\n]+/g, '{| class="wikitable"' ); // Remove custom styling
		string = '\n' + string + '\n'; // Give tables some space
		return string;
	},

	/**
	 * Initialization script
	 */
	init: function () {
		if ( [ 'edit', 'submit' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
			mw.loader.using( 'user.options' ).then( function () {
				if ( mw.user.options.get( 'usebetatoolbar' ) == 1 ) {
					$.when(
						mw.loader.using( 'ext.wikiEditor' ), $.ready
					).then( Normalizer.addButton );
				}
			} );
		}
		if ( ve ) {
			//Normalizer.addTool();
		}
	},

	/**
	 * Add normalizer button to the WikiEditor toolbar
	 */
	addButton: function () {
		$( '#wpTextbox1' ).wikiEditor( 'addToToolbar', {
	        section: 'main',
	        group: 'format',
	        tools: {
	            normalizer: {
	                label: 'Normalize',
	                type: 'button',
	                icon: '//upload.wikimedia.org/wikipedia/commons/thumb/4/45/Magic_wand_icon.png/20px-Magic_wand_icon.png',
	                action: {
	                    type: 'callback',
	                    execute: Normalizer.execute
	                }
	            }
	        }
	    } );
	},

	/**
	 * Add normalizer tool to the VisualEditor toolbar
	 */
	addTool: function () {

		// Create and register command
		function normalizeCommand() {
			normalizeCommand.parent.call( this, 'normalize' );
		}
		OO.inheritClass( normalizeCommand, ve.ui.Command );

		normalizeCommand.prototype.execute = function ( surface ) {
			Normalizer.execute();
			return true;
		};
		normalizeCommand.prototype.isExecutable = function () {
		    var surface = ve.init.target.getSurface();
		    return surface && surface.getMode() === 'source';
		};
		ve.ui.commandRegistry.register( new normalizeCommand() );

		// Create, register and insert tool
		function normalizeTool() {
			normalizeTool.parent.apply( this, arguments );
		}
		OO.inheritClass( normalizeTool, ve.ui.Tool );

		normalizeTool.static.name = 'normalize';
		normalizeTool.static.group = 'utility';
		normalizeTool.static.title = 'Normalize';
		normalizeTool.static.icon = 'normalizer';
		normalizeTool.static.commandName = 'normalize';
		normalizeTool.static.autoAddToCatchall = false;
		normalizeTool.static.deactivateOnSelect = false;

		normalizeTool.prototype.onUpdateState = function () {
			normalizeTool.parent.prototype.onUpdateState.apply( this, arguments );
			this.setActive( false );
		};

		ve.ui.toolFactory.register( normalizeTool );

		mw.util.addCSS( '.oo-ui-icon-normalizer { background-image: url("//upload.wikimedia.org/wikipedia/commons/4/45/Magic_wand_icon.png"); }' );

		ve.init.mw.DesktopArticleTarget.static.actionGroups[ 1 ].include.push( 'normalize' );
	},

	execute: function ( context ) {
		var wikitext = $( '#wpTextbox1' ).textSelection( 'getSelection' );
		if ( wikitext ) {
			wikitext = Normalizer.normalize( wikitext );
			$( '#wpTextbox1' ).textSelection( 'replaceSelection', wikitext );
		} else {
			wikitext = $( '#wpTextbox1' ).textSelection( 'getContents', wikitext );
			wikitext = Normalizer.normalize( wikitext );
			$( '#wpTextbox1' ).textSelection( 'setContents', wikitext );
		}
		var summary = $( '#wpSummary' ).val();
		if ( !summary ) {
			$( '#wpSummary' ).val( 'Normalize' );
		}
	}
};

$.when( mw.loader.using( [
	'ext.visualEditor.core',
	'jquery.textSelection'
] ), $.ready ).then( Normalizer.init );
