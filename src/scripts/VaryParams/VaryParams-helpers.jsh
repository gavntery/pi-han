// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// VaryParams-helpers.jsh - Released 2013/12/03 16:15:08 UTC
// ****************************************************************************
//
// This file is part of VaryParams script version 1.5
// 
// The complete source code with test scripts is hosted at:
//    https://bitbucket.org/bitli/varyparams
//
// Copyright (c) 2012-2013 Jean-Marc Lugrin
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
// ****************************************************************************

#include <pjsr/UndoFlag.jsh>

// For OperatesOn,
#define VP_OPERATE_UNDEFINED (-1)
#define VP_OPERATE_MODIFYING_SOURCE 0
#define VP_OPERATE_PROCESS_GENERATING_NEW_WINDOW 1
#define VP_OPERATE_GLOBALLY 2


// ----------------------------------------------------------------------------------------------------------------------
// String support
// They are not added to the String prototype to avoid coexistence issue with other code
// ----------------------------------------------------------------------------------------------------------------------

// Return true if a String is not null and not empty, it is recommended to use "" for empty string,
// as this work better with UI and saving as text
function vP_isBlank(str) {
   if (str === null) {
      return true;
   }
   if ("" === str.trim()) {
      return true;
   }
   return false;
}

// Pad a string with spaces to the left, but truncate at right if larger than the maximum size
function vP_padLeftTruncated(str, len) {
   if (str.length > len) {
      return str.substring(0,len);
   } else if (str.length<len) {
      var spaces = "";
      for (var i=0; i<len-str.length; i++) {
         spaces += " ";
      }
      return spaces + str;
   } else {
      return str;
   }
}

// Truncate file names at left (indicate by ...)
function vP_TruncateLongFileNames(str, len) {
   // Simplistic algorithm
   if (str.length>len) {
       return "..."+str.substring(str.length -3 - len);
    } else {
       return str;
   }
}

// Find the maximum length of a list of string, limited to max
function vP_findMinColWidth(title, values, max) {

   var colLen = Math.min(title.length,max);
   for (var i=0; i<values.length; i++) {
      var valueLength = Math.min(("" + values[i]).length, max);
      colLen = Math.max(colLen, valueLength);
   }
   return colLen;
}


// Hide some differences between 1.7 and 1.8
function vP_isOpenWindow(w) {
#ifgteq __PI_BUILD__ 932
    return ((!w.isClosed) && w.isValidView(w.mainView));
#else
    return (w.isValidView(w.mainView));
#endif
}


// ----------------------------------------------------------------------------------------------------------------------
// Environment support
// ----------------------------------------------------------------------------------------------------------------------

// Keeps track of the environment at the time of object creation (at script start for
// the default global object) and provide access to current active view and main views
// created after the environment object was created.
// Packaged in one object so that it can be easily adapted for example for unit testing
var vP_makeEnvironment = function() {

#ifdef DEBUG
   Console.writeln("vP_makeEnvironment calling gc() to limit the number of false windows");
#endif
   // This lower the chance of ImageWindow.windows returning a bizare object
   gc(true);

   // Values initialized when the object is created (see code below)
   var privateInitialMainViews = [];
   var privateInitialMainViewUniqueIds = [];
   // The list of uniqueId of the main view of closed windows
   var privateClosedWindowsUniqueIds = [];

   // Get the current view of the active window (or its main view), checking that the views is valid
   function privateGetCurrentView() {
      var w = ImageWindow.activeWindow;
      if (w.isNull)  {
        return null;
      }
      var v = w.currentView;
      // Not sure this is required, but could ensure that we return something useful
      if (v.isNull || !w.isValidView(v)) {
         v= w.mainView;
      }
      if (v.isNull || !w.isValidView(v)) {
         return null;
      };
      return v;
   };

   // Get all the main views, skipping the one explictely closed by the script (as they are still returned as open by PI)
   function privateGetCurrentMainViews() {
      var mainViews = [];
      // Since the version 1.8.0 RC1 we should use the property isClosed from the returned window (done in isOpenWindow)
      // Since the version 1.8.0 RC2 we should use the property openWindows instead of windows.
      // See http://pixinsight.com/forum/index.php?topic=5038.msg34815#msg34815
      // Currently the code still use hack working in PI 1.7, with a workaround for a bug in 1.8RC1-3,
      // for lack of time to do version dependent code.
      // In 1.8 RC1-3 ImageWindow.windows.length sometimes returns a singleton instead of an array
      // try to recover by building the array

      var ws = ImageWindow.windows;
      if (typeof ws.length === 'undefined') {
         //throw "VaryParams-helper-jsh - PJSR error - 'ImageWindow.windows' returned an object with an undefined length attribute: " + ws + " " + ws.mainView.id;
         Console.writeln("VaryParams-helper-jsh - PJSR error - Using workaround on issue of ImageWindow.windows - see explanation is source code");
         ws = [ws];
      }
      for (var i=0; i<ws.length; i++) {
         var w = ws[i];
         if (vP_isOpenWindow(w)) {
            if (privateClosedWindowsUniqueIds.indexOf(w.mainView.uniqueId) === -1) {
               mainViews.push(w.mainView);
            }
         }
      };
      return mainViews;
   };

   // Keeps track of the main views known at environment setup, they will be ignored
   // when the list of additional main views is requested
   privateInitialMainViews = privateGetCurrentMainViews();
   for (var i=0; i<privateInitialMainViews.length; i++) {
      var v = privateInitialMainViews[i];
      privateInitialMainViewUniqueIds.push(v.uniqueId);
#ifdef DEBUG
      Console.writeln("  vP_makeEnvironment: privateInitialMainViewUniqueIds: ", v.fullId, ", uniqueId: ", v.uniqueId);
#endif
   };

   function privateGetAdditionalMainViews() {
      var additionalMainViews = [];
      var vs = privateGetCurrentMainViews();
#ifdef DEBUG
      Console.writeln("  privateGetAdditionalMainViews: current main views: ", vs.length);
#endif
      for (var i=0; i<vs.length; i++) {
         var v = vs[i];
#ifdef DEBUG
         // Console.writeln("  getAdditionalMainViewsHelper: mainview ", v.fullId, ", uniqueId: ", v.uniqueId);
#endif
         if (privateInitialMainViewUniqueIds.indexOf(v.uniqueId)<0) {
#ifdef DEBUG
            Console.writeln("  privateGetAdditionalMainViews: adding view  ", v.fullId, ", uniqueId: ", v.uniqueId);
#endif
            additionalMainViews.push(v);
         }
      }
      return additionalMainViews;
   };


   function privateGetAdditionalMainViewsExcept(viewFullIdsToIgnore) {
      return privateGetAdditionalMainViews().filter(function(v){
         return viewFullIdsToIgnore.indexOf(v.uniqueId)===-1;
      });
   };


   // Keep track of closed window to skip them when listing windows
   function privateForceCloseWindow(window) {
      if (!window.isNull) {
         var id = window.mainView.uniqueId;
         if (privateClosedWindowsUniqueIds.indexOf(id)===-1) {
            privateClosedWindowsUniqueIds.push(id);
         }
         window.forceClose();
#ifdef DEBUG
         Console.writeln("privateForceCloseWindow: Closing window '", window.mainView.fullId, "', uniqueId: ", window.mainView.uniqueId);
#endif
      }
   };


    // Get the list of possible operations for a view which may be null)
    // Formally a single operation should be returned
    // If none, then the process cannot operate on that view (for example it is a preview and it cannot operate on preview)
    // I do not know if multiple returns are possible (global and view), but this should work
    function privateGetOperateOnList(process,view) {
       var operateOnList = [];
       if (view !== null && process.canExecuteOn(view)) {
          if (process.isHistoryUpdater(view)) {
             operateOnList.push(VP_OPERATE_MODIFYING_SOURCE);
          } else {
             operateOnList.push(VP_OPERATE_PROCESS_GENERATING_NEW_WINDOW);
          }
       }
       if (process.canExecuteGlobal()) {
         operateOnList.push(VP_OPERATE_GLOBALLY);
       }
      return operateOnList;
   }

   // The properties exposed
   return {
      // Get the current view
      getCurrentView: privateGetCurrentView,
      // Get the view that had focus at start of script (or null)
      initialView: privateGetCurrentView(),
      // The list of all icon names at start of script
      initialProcessInstanceNames: ProcessInstance.icons().sort(),
      // Function to get all valid mainViews (those not closed)
      getCurrentMainViews: privateGetCurrentMainViews,
      // get main views added since the start of the process
      getAdditionalMainViews: privateGetAdditionalMainViews,
      // get main views added since the start of the process, except if part of the array of full id
      getAdditionalMainViewsExcept: privateGetAdditionalMainViewsExcept,
      // The list of main views at the start of the script
      initialMainViews: privateInitialMainViews,
      // Function to forceClose a window (keeping track of closed windows to work around bizare implementation of PJSR)
      forceCloseWindow: privateForceCloseWindow,
      // Get operation modes of the process
      getOperateOnList: privateGetOperateOnList,
      // Default output directory, usually replaced by user
      defaultOutputDirectory: File.systemTempDirectory
   };
};




// ------------------------------------------------------------------------------------------------------------------------
// Process reflection - support methods to access icons and create processes
// ------------------------------------------------------------------------------------------------------------------------

// Return a list of all process icons in this project applicable to the current view or global,
// with the exception of known unsupported processes.
function vP_makeListOfPotentialProcessIcons(view) {
   return ProcessInstance.icons().filter(function (icon) {
      var pi = ProcessInstance.fromIcon(icon);
      // List of unsupported processed (TODO make a table)
      if (pi.processId() === 'ProcessContainer'
          || pi.processId() === 'Script') return false;
      if (pi.canExecuteGlobal()) { return true;}
      return view && pi.canExecuteOn(view);
      });
}


// Make a copy of a process instance (to avoid marking the original one as modified)
// and set the specified parameters
function vP_makeParameterizedProcessInstance(processInstanceName, paramName, paramValue) {
   var processInstance = ProcessInstance.fromIcon(processInstanceName);
   if (typeof processInstance === "null") {
      throw "No instance of " + processInstanceName;
   }
   var ProcessConstructor = processInstance.constructor;
   var newProcessInstance = new ProcessConstructor;
   newProcessInstance.assign(processInstance);
   newProcessInstance[paramName] = paramValue;
   return newProcessInstance;
}

// Return a list of parameter definitions, each parameter definition being a 2 elements array,
// the first element is the name, the second is the current value in the process
function vP_getListOfParameters(processInstanceName) {
   if ((typeof(processInstanceName) !== "string") || vP_isBlank(processInstanceName)) {
      throw "processInstanceName not initialized";
   }
   // Name of the variable used to store the process
   var parameters = [];
   var processInstance = ProcessInstance.fromIcon(processInstanceName);

   // On PI 1.7
   //var propertyNames = Object.getOwnPropertyNames(processInstance);
   // Required on PI 1.8
   var propertyNames = [];
   for (var n in processInstance) {
      propertyNames.push(n);
   }

   for (var i=0; i<propertyNames.length; i++) {
      var p=propertyNames[i];
      //for (var p in processInstance) {
         //Console.writeln("Prop Descr ",p, " ", Object.getOwnPropertyDescriptor(processInstance, p).writable);
      var param = [p, processInstance[p]];
      parameters.push(param);
   }

   return parameters;
}



// Return the sorted list of parameter names (an array of string)
function vP_getListOfParameterNames (processInstanceName) {
   var parameters = vP_getListOfParameters(processInstanceName)

   parameters = parameters.sort(function(p1, p2){return p1[0]>p2[0]});
   return parameters.map(function(p){return p[0]})
}






// ------------------------------------------------------------------------------------------------------------------------
// Copy a view to a new image, posibly with mask
// ------------------------------------------------------------------------------------------------------------------------
// TODO keep STF
// Todo keep history
function vP_copyImageFromView(view, newId, withMask) {
#ifdef debug
   Console.writeln("vP_copyImageFromView: from " , view.fullId, ", to: ", newId, ", withMask: ", withMask);
#endif
   var img = view.image;
   var newWindow = new ImageWindow( img.width, img.height, img.numberOfChannels,
                       img.bitsPerSample, img.isReal, img.isColor, newId);
   var v = newWindow.mainView;
   var i = v.image;

   v.beginProcess( UndoFlag_NoSwapFile );
   i.apply(img)
   v.endProcess();

   if (withMask) {
      var w = view.window;
      newWindow.mask = w.mask;
      newWindow.maskEnabled = w.maskEnabled;
      newWindow.maskInverted = w.maskInverted;
      newWindow.maskMode = w.maskMode;
      newWindow.maskVisible = w.maskVisible;
   }

   return newWindow;
}



// ----------------------------------------------------------------------------------------------------------------------
// Find a unique short name suitable as an id suffix from an array of values
// TODO Not yet used
// ----------------------------------------------------------------------------------------------------------------------
function vP_findShortNames(values) {
   if (values.length>0) {
      // If nothing else works, return numbers from 1 to n, as string
      var valueType = typeof values[0];
      Console.writeln("T ", valueType);
      if (valueType === "string") {
         // Find common prefix
         return vP_makeUniquePrefixStrings(values);
      } else if (valueType === "number") {
         return vP_makeUniquePrefixNumbersAsStrings(values);
      } else {
         return vP_makeSequentialNumberIds(values.length);
      }
   }
   return [];
}
// Make a suffix based on a sequence of number, in case the unique name cannot be created
function vP_makeSequentialNumberIds(len) {
   var names = [];
   for (var i=0; i<len; i++) {
      names.push( "" + (i+1));
   }
   return names;

}

// Make a prefix of the names uniquely identifying each value
function vP_makeUniquePrefixStrings(values,n) {
   var names = [];
   for (var i=0; i<values.length; i++) {
      var name = values[i];
      //Console.writeln("i ", i, ", name '", name, "'");
      var prefix = name.charAt(0).toUpperCase();
      //Console.writeln("P1 ", prefix);
      var wasSpace = false;
      for (var k=1; k<name.length; k++) {
         //Console.writeln("name '", name, "', length ", name.length);
         var c = name.charAt(k);
         Console.writeln("k ", k, " c ", c, ", wasSpace " , wasSpace);
         if (wasSpace || (c === c.toUpperCase() && c.toUpperCase() !== c.toLowerCase())) {
            prefix = prefix + c;
         }
         wasSpace = (c===' ');
      }
      Console.writeln("P2 ", prefix);
      prefix = prefix.replace(/[.-]/g,"_");
      prefix = prefix.replace(/[^a-zA-Z0-9-_]/g,"");
      Console.writeln("P3 ", prefix);
      names.push( "" + prefix);
   }
   // Check unique
   var sortedNames = names.map(function(v){return v;});
   sortedNames.sort();
   for (var i=1; i<sortedNames.length; i++) {
      if (sortedNames[i-1]===sortedNames[i]) return vP_makeSequentialNumberIds(values.length);
   }
   return names;
}

// Make a table of prefix of the numbers uniquely identifying each value
function vP_makeUniquePrefixNumbersAsStrings(values,n) {
   var vs = values.map(function(v){return (""+v).replace(/[.+-]/g,"_")});
   // Check minimum prefix length
   var sortedNames = vs.map(function(v){return v;});
   sortedNames.sort();
   for (var i=1; i<6; i++) {
      if (vP_checkUniquePrefix(sortedNames, i)) {
         return vs.map(function(v){return v.substring(0,Math.min(v.length, i))});
      }
   }
   return vP_makeSequentialNumberIds(values.length);
}

// Check that all strings are unique even if truncated at prefixLen
function vP_checkUniquePrefix(sortedValues, prefixLen) {
   for (var i=1; i<sortedValues.length; i++) {
      var v1 = sortedValues[i-1];
      var v2 = sortedValues[i];
      var v1p = v1.substring(0,Math.min(v1.length, prefixLen));
      var v2p = v2.substring(0,Math.min(v2.length, prefixLen));
      if (v1p===v2p) return false;
   }
   return true;
}

// ****************************************************************************
// EOF VaryParams-helpers.jsh - Released 2013/12/03 16:15:08 UTC
