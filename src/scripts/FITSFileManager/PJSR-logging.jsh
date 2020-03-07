// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// PJSR-logging.jsh - Released 2020-01-27T18:07:10Z
// ----------------------------------------------------------------------------
//
// This file is part of FITSFileManager script version 1.5
// 
// The complete source code with test scripts is hosted at:
//    https://github.com/bitli/FitsFileManager
//
// Copyright (c) 2012-2020 Jean-Marc Lugrin.
// Copyright (c) 2003-2020 Pleiades Astrophoto S.L.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

var Log = ( function()
{
   // --- private variables and methods for pretty print ----------------
   // From the web, made a little bit more robust
   var maxDepth = 20;

   function pp( object, depth, embedded )
   {
      var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
         escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
         gap,
         indent,
         meta = { // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
         },
         rep;

      function quote( string )
      {
         // If the string contains no control characters, no quote characters, and no
         // backslash characters, then we can safely slap some quotes around it.
         // Otherwise we must also replace the offending characters with safe escape
         // sequences.

         escapable.lastIndex = 0;
         return escapable.test( string ) ? '"' + string.replace( escapable,
            function( a )
            {
               var c = meta[ a ];
               return typeof c === 'string' ?
                  c :
                  '\\u' + ( '0000' + a.charCodeAt( 0 ).toString( 16 ) ).slice( -4 );
            } ) + '"' : '"' + string + '"';
      }

      typeof( depth ) == "number" || ( depth = 0 )

      // Limit depth to avoid recursion issues
      if ( depth > maxDepth )
         return "...";

      typeof( embedded ) == "boolean" || ( embedded = false )
      var newline = false;
      var spacer = function( depth )
      {
         var spaces = "";
         for ( let i = 0; i < depth; i++ )
            spaces += "  ";
         return spaces;
      };

      var pretty = "";
      if ( typeof( object ) === "undefined" )
         pretty += "undefined";
      else if ( typeof( object ) === "boolean" || typeof( object ) === "number" )
         pretty += object.toString();
      else if ( typeof( object ) === "string" )
         pretty += quote( object );
      // Avoid error if a function is part of an object
      else if ( typeof( object ) === "object" && object.constructor.name === "RegExp" )
         pretty += object.toString();
      else if ( typeof( object ) === "function" )
         pretty += "function ... (" + object.length + ")";
      else if ( object === null )
         pretty += "null";
      else if ( object instanceof( Array ) )
      {
         if ( object.length > 0 )
         {
            if ( embedded )
               newline = true;
            var content = "";
            // The use of for each is deprecated, but it still seems to work
            for each( var item in object )
               content += pp( item, depth + 1 ) + ",\n" + spacer( depth + 1 );
            content = content.replace( /,\n\s*$/, "" ).replace( /^\s*/, "" );
            pretty += "[ " + content + "\n" + spacer( depth ) + "]";
         }
         else
            pretty += "[]";
      }
      else if ( typeof( object ) == "object" )
      {
         if ( Object.keys( object ).length > 0 )
         {
            if ( embedded )
               newline = true;
            var content = "";
            for ( let key in object )
               content += spacer( depth + 1 ) + key.toString() + ": " + pp( object[ key ], depth + 2, true ) + ",\n";
            content = content.replace( /,\n\s*$/, "" ).replace( /^\s*/, "" );
            pretty += "{ " + content + "\n" + spacer( depth ) + "}";
         }
         else
            pretty += "{}";
      }
      else
         pretty += object.toString();

      return ( ( newline ? "\n" + spacer( depth ) : "" ) + pretty );
   }

   // --- private variables and methods for debug ---------------------------
   var debugOn = true;

   // To escape HTML characters for the console
   var escapeMap = {
      '"': '&quot;',
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
   };
   var escapeHTML = function( text )
   {
      return text.replace( /[\"&<>]/g,
         function( a )
         {
            return escapeMap[ a ];
         } );
   };

   // --- public properties and methods ---------------------------------------
   return {
      // Debug log the arguments to the console (separated by spaces) if debug log is active
      // null and undefined are transformed in string
      // arrays are shown as array (first level only)
      // Example:
      //    Log.debug("My list:", [1,2,3,4], "is", null);
      // TODO Support more formatting as needed
      debug: function()
      {
         var str, arg, i;
         if ( debugOn )
         {
            //var str =  Array.prototype.slice.call(arguments).join("");
            str = "";
            for ( i = 0; i < arguments.length; i++ )
            {
               if ( i > 0 )
                  str += " ";
               arg = arguments[ i ];
               if ( typeof arg === "undefined" )
                  str += "undefined";
               else if ( arg === null )
                  str += "null";
               else if ( Array.isArray( arg ) )
                  str += "[" + arg.toString() + "]"; // Should handle recursively, limit depth, ...
               else
                  str += arg.toString();
            }
            console.writeln( escapeHTML( str ) );
            console.flush();
         }
      },
      pp: pp,
   };

} )();

#ifdef DEBUG
var debug = Log.debug;
#endif

// ----------------------------------------------------------------------------
// EOF PJSR-logging.jsh - Released 2020-01-27T18:07:10Z
