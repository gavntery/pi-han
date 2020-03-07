// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// WeightedBatchPreprocessing-helper.js - Released 2020-01-24T12:08:35Z
// ----------------------------------------------------------------------------
//
// This file is part of Weighted Batch Preprocessing Script version 1.4.4
//
// Copyright (c) 2012 Kai Wiechen. All Rights Reserved.
// Copyright (c) 2019-2020 Roberto Sartori. All Rights Reserved.
// Copyright (c) 2019-2020 Tommaso Rubechi. All Rights Reserved.
// Copyright (c) 2012-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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

/*
 * Helper routines
 */

// ----------------------------------------------------------------------------
// Extensions to the Array object
//
// NB: Define new methods of the Array object as nonenumerable properties with
//     Object.defineProperty() to prevent problems with "for...in" constructs.
// ----------------------------------------------------------------------------

var helperFunctions = () => (
{
   /*
    * Returns an array of enabled target frames.
    * Used to build the input for ImageCalibration/ImageIntegration/StarAlignment
    */
   enableTargetFrames: function( array, ncolumns, enableDrizzle )
   {
      let target = new Array;
      for ( let i = 0; i < array.length; ++i )
      {
         target[ i ] = new Array( ncolumns );
         for ( let j = 0; j < ncolumns - 1; ++j )
            target[ i ][ j ] = true;
         target[ i ][ ncolumns - 1 ] = array[ i ];
         if ( enableDrizzle )
            target[ i ][ ncolumns ] = File.changeExtension( array[ i ], '.xdrz' );
      }
      return target;
   },

   // ----------------------------------------------------------------------------
   // String Utils
   // ----------------------------------------------------------------------------

   /*
    * Returns a clean filter name.
    */
   cleanFilterName: function( str )
   {
      return str.replace( /[^a-zA-Z0-9\+\-_]/g, '_' ).replace( /_+/g, '_' );
   },

   /*
    * Returns true if this string is empty.
    */
   isEmptyString: function( str )
   {
      return str.length <= 0;
   },

   /*
    * Returns true if this string contains the specified substring.
    */
   stringHas: function( str, s )
   {
      return str.indexOf( s ) > -1;
   },

   // ----------------------------------------------------------------------------
   // File Utils
   // ----------------------------------------------------------------------------

   /*
    * Creates a directory if it does not exist.
    * Returns the directory path.
    */
   existingDirectory: function( dir )
   {
      if ( !File.directoryExists( dir ) )
         File.createDirectory( dir );
      return dir;
   },

   /*
    * Returns the name and extension components of a path specification.
    */
   extractNameAndExtension: function( path )
   {
      return File.extractName( path ) + File.extractExtension( path );
   },

   // ----------------------------------------------------------------------------
   // SMART NAMING HELPERS
   // ----------------------------------------------------------------------------
   smartNaming:
   {
      lastMatching: function( text, regexp )
      {
         let matches = text.match( regexp )
         if ( matches != null && matches.length > 0 )
         {
            return matches[ matches.length - 1 ];
         }
         return undefined;
      },

      /*
       * Extract the image tyoe from the last matching pattern occurrence in its
       * filePath.
       *
       * filePath must contain one pr more of BIAS, DARK, DARKS, FLAT, FLATS, LIGHT
       * or LIGHTS. The last of the sequence will be taken. It is useful to check the
       * whole path since instead of renaming single files it's possible to put all
       * light files into an enclosing folder with the word "lights" in the name.
       *
       * NOTE: negative look behind is not supported in JS so the first char
       * before the keywords is matched and removed in the switch.
       */
      geImageTypeFromPath: function( filePath )
      {
         let regexp = /(?![a-z0-9]).{0,1}(BIAS|DARK|DARKS|FLAT|FLATS|LIGHT|LIGHTS)(?![a-z0-9])/gi;
         let fileType = this.lastMatching( filePath, regexp );
         if ( fileType )
         {
            switch ( fileType.substr( 1 ).toUpperCase() )
            {
               case 'BIAS':
                  return ImageType.BIAS;
               case 'DARK':
               case 'DARKS':
                  return ImageType.DARK;
               case 'FLAT':
               case 'FLATS':
                  return ImageType.FLAT;
               case 'LIGHT':
               case 'LIGHTS':
                  return ImageType.LIGHT;
            }
         }

         return ImageType.UNKNOWN;
      },

      /*
       * Extract the exposure time from the last matching pattern occurrence in its filePath.
       * Exposure can be specified by means of he
       */
      getExposureTimeFromPath: function( filePath )
      {
         // match the format EXPTIME_10.0 or EXPOSURE_2
         let regexp = /(EXPTIME|EXPOSURE)(_|-| )[0-9]+(\.[0-9]*)?/gi;
         let match = this.lastMatching( filePath, regexp );
         if ( match )
         {
            let sanitizedStrValue = match.replace( /(EXPTIME|EXPOSURE)(_|-| )/gi, '' );
            let value = Number( sanitizedStrValue );
            return value !== NaN ? value : 0
         }
         // find any number followed by 's' or 'sec' ore '_secs' like 2s, 2.1_secs or 2.2sec
         let postfixes = [ 's', 'sec', '_secs' ];
         regexp = /[0-9]+(\.[0-9]*)?(?=(s|sec|_secs)[^a-zA-Z0-9])/gi;
         let matches = regexp.exec( filePath );
         if ( matches !== null )
         {
            let sanitizedStr = matches[ 0 ];
            postfixes.forEach( postfix =>
            {
               sanitizedStr = sanitizedStr.replace( postfix, '' );
            } )
            let value = Number( sanitizedStr );
            return value !== NaN ? value : 0
         }
         return 0;
      },

      /*
       * Extract the binning from the last matching pattern occurrence in its filePath.
       */
      getBinningFromPath: function( filePath )
      {
         let regexp = /(XBINNING|CCDBINX|BINNING)(_|-| )[0-9]+/gi;
         let match = this.lastMatching( filePath, regexp );
         if ( match )
         {
            let sanitizedStrValue = match.replace( /(XBINNING|CCDBINX|BINNING)(_|-| )/gi, '' );
            let value = Number( sanitizedStrValue );
            return value !== NaN ? value : 1
         }
         return 1
      },

      /*
       * Extract the filter name from the last matching pattern occurrence in its filePath.
       * Poissible valid combinations within the path are:
       * - FILTER NebulaBooster
       * - FILTER-Ha
       * - INSFLNAM_L
       */
      getFilterFromPath: function( filePath )
      {
         let regexp = /(FILTER|INSFLNAM)(_|-| )[a-zA-Z0-9]+/gi;
         let match = this.lastMatching( filePath, regexp );
         if ( match )
            return match.replace( /(FILTER|INSFLNAM)(_|-| )/gi, '' );
         return '';
      },
   },

   // ----------------------------------------------------------------------------
   // Extensions to the Parameters object
   // ----------------------------------------------------------------------------
   parameters:
   {
      indexedId: function( id, index )
      {
         return id + '_' + ( index + 1 ).toString(); // make indexes one-based
      },
      hasIndexed: function( id, index )
      {
         return Parameters.has( this.indexedId( id, index ) );
      },
      getBooleanIndexed: function( id, index )
      {
         return Parameters.getBoolean( this.indexedId( id, index ) );
      },
      getIntegerIndexed: function( id, index )
      {
         return Parameters.getInteger( this.indexedId( id, index ) );
      },
      getRealIndexed: function( id, index )
      {
         return Parameters.getReal( this.indexedId( id, index ) );
      },
      getStringIndexed: function( id, index )
      {
         return Parameters.getString( this.indexedId( id, index ) );
      },
      getUIntIndexed: function( id, index )
      {
         return Parameters.getUInt( this.indexedId( id, index ) );
      },
      getStringList: function( id )
      {
         let list = new Array();
         if ( Parameters.has( id ) )
         {
            let s = Parameters.getString( id );
            list = s.split( ':' );
            for ( let i = 0; i < list.length; ++i )
               list[ i ] = list[ i ].trim();
         }
         return list;
      },
      setIndexed: function( id, index, value )
      {
         return Parameters.set( this.indexedId( id, index ), value );
      },
   },
} );

var WBPPUtils = ( function()
{
   this.instance = null;

   function createInstance()
   {
      return helperFunctions();
   }

   return {
      shared: function()
      {
         if ( !this.instance )
            this.instance = createInstance();
         return this.instance;
      }
   };
} )();

// ----------------------------------------------------------------------------
// EOF WeightedBatchPreprocessing-helper.js - Released 2020-01-24T12:08:35Z
