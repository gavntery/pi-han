// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// VaryParams-engine.jsh - Released 2013/12/03 16:15:08 UTC
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

function Vp_VaryProcessEngine(environment) {

   // -- Values filled before the engien executes
   this.environment = environment;
   // If source view is not null, it is used for each process, otherwise execute global is used
   this.sourceView = null;
   // The name of the process to execute
   this.processInstanceName = null;
   // The name of the parameter to vary
   this.parameterToVary = null;
   // The values (from 0 to n-1) of the parameter
   this.parameterValues = null;

   // -- State modified by the engine
   // The sequence number of the execution (will be 1 to n during execution)
   this.outputIndex = 0;
   // Current parameter
   this.currentParameterValue = null;
   // The view to operate upon (may be the source view or a copy), null if execute globally
   this.workView =  null;
   // uniqueId of the additional views at the beginning of the process
   this.viewsUniqueIdsBeforeProcess = [];
   // An array of all the resulting views (there may be restriction or special handling if no or more than one view exists)
   this.resultViews = null;
   // The view to save or process, must be one of the resultViews (normaly the single one).
   this.resultPrimaryView = null;
   // The identification of the generated results (view id or file names) for logging purpose
   this.generatedResults =[];

   // See vP_makeEngineCreationError in driver for reason of this variable
   this.engineCreationError = false;

   // -- Default instance methods

   // IMPORTANT:  All the execution methods must return an 'error' which is false in case of
   // success and an error string in case of error.  So the execution methods can be
   // chained by 'or' and the caller is in charge to display the error message (or
   // possibly throw an exception in case of unit test).
   // Warning are displayed directly on the console.
   // Internal (programming) errors are signaled by 'throw' - they should not happen-:)

   // The following methods are default implementation of each processing step.
   // They will be replaced by the method required for the desired operation
   // by the setup methods


   // Initialize any processing specific
   this.initialize = function initialize () {
      return false;
   };

   // Called before a process is executed (clean-up and prepare count)
   this.prepareNextProcess = function defaultPrepareNextProcess () {
      this.currentParameterValue = this.parameterValues[this.outputIndex];
      this.outputIndex += 1;
      this.viewsUniqueIdsBeforeProcess =  this.environment.getAdditionalMainViews().map(function(v){return v.uniqueId;});
      return false;
   };

   // Prepare the view that will be operated upon (workView) if any.
   this.prepareWorkView = function defaultPrepareSourceView () {
      return false;
   };

   // Execute the process (on the work view or globally) with the specified parameters
   this.executeProcess = function defaultExecuteProcess() {
      return false;
   };

   // Ensure that the source view as not modified by accident
   this.checkSourceView = function defaultCheckSourceView() {
      return false;
   };

   // Find the result view
   this.checkResultView = function defaultCheckResultView() {
      return false;
   };

   // Save the result view if needed
   this.saveResultView = function defaultSaveResultView() {
      return false;
   };

   // The process has been executed for all values, log results
   this.complete =  function defaultComplete() {
      return false;
   };


}

// ----------------------------------------------------------------------------------------------------------------------
// Engine prototype, define the methods used to setup the engine and to execute the processes
// ----------------------------------------------------------------------------------------------------------------------
var vP_ProcessEnginePrototype = {

   // These are the setup methods that either set some variable or set some processing
   // function on the instance.

   // Select process
   setProcessInstanceName: function setProcessInstanceName(processInstanceName) {
      this.processInstanceName = processInstanceName;
   },

   // -- Select processing method
   // The process operate on the source view and generate a new view
   setOperateGenerateNewView: function setOperateGenerateNewView (aSourceView) {
#ifdef DEBUG
      Console.writeln("setOperateGenerateNewView()");
#endif
      this.sourceView = aSourceView;

      this.prepareWorkView = function() {
         this.workView = aSourceView;
         if (this.sourceView.window.isModified)  {
            // This restriction allow use to check that there is no unwanted modifications, it should be tested before starting the process
            throw "Cannot operate on modified source window";
         }
         return false;
      };
      this.executeProcess = function() {
         // TODO This is a test to see if the result view is also brink to front
         this.workView.window.bringToFront();
         // In the hope that more cleanup be done by procesEvents (as closing windows)
         processEvents();
         var result = vP_executeOnView(this.workView, this.processInstanceName, this.parameterToVary,  this.currentParameterValue);
         processEvents();
         if (!result) {
            return "The process returned a failed status, look at the log for details";
         }
         return false;
      };
      this.checkSourceView = function() {
         if (this.sourceView.window.isModified)  {
            this.sourceView.window.undo();
            return "ERROR: This process modifies the source window, please select 'Update source image' in process mode, modifications undone";
         }
         return false;
      };
      this.checkResultView = function() {
         // This process should generate at least a new main view, get all the generated ones
         this.resultViews = this.environment.getAdditionalMainViewsExcept(this.viewsUniqueIdsBeforeProcess);

         // Work around PI bizare results, some views we did not ask (for example the background of an ABE)
         // are still generated by not visible. Sort the views in two categories: visible (useful) and nvisible (to ignore)
         var resultViewsVisible = this.resultViews.filter(function(v){return v.window.visible});
         var resultViewsNotVisible = this.resultViews.filter(function(v){return !v.window.visible});


         // Tell the user what was generated
         Console.writeln( this.processInstanceName, " generated the windows: ", (resultViewsVisible.map(function(v){return v.fullId})).join(","));
         if (resultViewsVisible.length == 0) {
            Console.writeln("ERROR: The process did not generate any visible window");
            return false;
         }
         if (resultViewsNotVisible.length >0) {
            Console.writeln( this.processInstanceName, " also generated the invisible windows: ", (resultViewsNotVisible.map(function(v){return v.fullId})).join(","));
         }
         // This may or may not help,
         //resultViewsNotVisible.forEach(function (v) {v.window.forceClose()});

         // Ensure that there is a primary view (the main view of the active ImageWindow)
         this.resultPrimaryView = this.environment.getCurrentView();
         if (this.resultPrimaryView === null) {
            Console.writeln("ERROR:The process did not set a valid active window, cannot identify resulting primary view");
            return false;
         }
#ifdef DEBUG
         Console.writeln("checkResultView(): Assume resulting primary view is ", this.resultPrimaryView.fullId);
#endif

         // We are only interested in the visible windows, make the primary window first
         this.resultViews = new Array;
         this.resultViews.push(this.resultPrimaryView);
         for (var i=0; i<resultViewsVisible.length; i++) {
            if (this.resultPrimaryView.uniqueId !== resultViewsVisible[i].uniqueId) {
               this.resultViews.push(resultViewsVisible[i]);
            }
         }


         // Adapt the names (be sure not have any non visible window in the list)
         var sourceViewId = this.sourceView.window.mainView.id;
         for (var i=0; i<this.resultViews.length; i++) {
            var mainView = this.resultViews[i];
            var id = mainView.id;
            if (id.indexOf(sourceViewId) !== 0) {
               id = sourceViewId + "_" + id;
            }
            id = id + "_" + this.outputIndex;
            mainView.id = id;
         }
         return false;
      }
   },

   // The process modifies the source view, need a copy
   setOperateOnCopyOfSourceView: function setOperateOnCopyOfSourceView(aSourceView) {
#ifdef DEBUG
      Console.writeln("setOperateOnCopyOfSourceView()");
#endif
      if (aSourceView == undefined) {
         throw "InternalScriptError";
      }
      this.sourceView = aSourceView;
      this.prepareWorkView = function() {
         if (this.sourceView.window.isModified)  {
            // This restriction allow use to check that there is no unwanted modifications, it should be tested before starting the process
            throw "Cannot operate on modified source window";
         }
         // Copy with mask
         var newViewId = this.makeNewViewId();
         var workWindow = vP_copyImageFromView(this.sourceView,newViewId, true);
         this.workView = workWindow.mainView;
         workWindow.show(); // in case it is kept at the end of the process
#ifdef DEBUG
         Console.writeln("setOperateOnCopyOfSourceView: Created window: ",workWindow.mainView.fullId);
#endif
         return false;
      };
      this.executeProcess = function(paramName, paramValue) {
         // TODO This is a test to see if the result view is also brink to front
         this.workView.window.bringToFront();
         // In the hope that more cleanup be done by procesEvents (as closing windows)
         processEvents();
         var result = vP_executeOnView(this.workView, this.processInstanceName, this.parameterToVary,  this.currentParameterValue);
         processEvents();
         if (!result) {
            return "The process returned a failed status, look at the log for details";
         }
         return false;
      };
      this.checkSourceView = function() {
         if (this.sourceView.window.isModified)  {
            this.sourceView.window.undo();
            throw "Internal script Error: Unexpected modification of source window while operation on a copy";
         };
         return false;
      };
      this.checkResultView = function() {
         this.resultViews = this.environment.getAdditionalMainViewsExcept(this.viewsUniqueIdsBeforeProcess);
         var resultViewsVisible = this.resultViews.filter(function(v){return v.window.visible});
         var resultViewsNotVisible = this.resultViews.filter(function(v){return !v.window.visible});
         if (resultViewsVisible.length == 0) {
           throw "Consistency error - we should at least have the copied window";
         }

         this.resultPrimaryView = this.workView;
         if (this.resultPrimaryView.uniqueId!==this.environment.getCurrentView().uniqueId) {
            Console.writeln("Warning: Current view is ", this.environment.getCurrentView().fullId, " expected and using ", this.resultPrimaryView.fullId);
         }
         Console.writeln( this.processInstanceName, " worked on the new windows: ", this.resultPrimaryView.fullId);
         var resultPrimaryViewUniqueId = this.resultPrimaryView.uniqueId;
         var resultViewsVisibleExceptPrimary = resultViewsVisible.filter(function(v){return v.uniqueId !== resultPrimaryViewUniqueId});
         if (resultViewsVisibleExceptPrimary.length >0 ){
            Console.writeln( this.processInstanceName, " also generated the windows: ", (resultViewsVisibleExceptPrimary.map(function(v){return v.fullId})).join(","));
         }
         if (resultViewsNotVisible.length >0) {
            Console.writeln( this.processInstanceName, " also generated the invisible windows: ", (resultViewsNotVisible.map(function(v){return v.fullId})).join(","));
         }

         // TODO refactor with above
         // We are only interested in the visible windows, make the primary window first
         this.resultViews = new Array;
         this.resultViews.push(this.resultPrimaryView);
         for (var i=0; i<resultViewsVisible.length; i++) {
            if (this.resultPrimaryView.uniqueId !== resultViewsVisible[i].uniqueId) {
               this.resultViews.push(resultViewsVisible[i]);
            }
         }

         // TODO Refactor with above
         // Adapt the names (be sure not have any non visible window in the list)
         var sourceViewId = this.sourceView.window.mainView.id;
         for (var i=0; i<this.resultViews.length; i++) {
            var mainView = this.resultViews[i];
            var id = mainView.id;
            if (id.indexOf(sourceViewId) !== 0) {
               id = sourceViewId + "_" + id;
            }
            id = id + "_" + this.outputIndex;
            mainView.id = id;
         }

         return false;
      }
   },

   // The process operates globally it does not need a view
   setExecuteGlobally: function setExecuteGlobally () {
      this.sourceView = null;
      this.prepareWorkView = function() {
         return false;
      };
      this.executeProcess = function(p) {
         // In the hope that more cleanup be done by procesEvents (as closing windows)
         processEvents();
         var result = vP_executeGlobally(this.processInstanceName, this.parameterToVary,  this.currentParameterValue);
         processEvents();
         return false;
      };
      this.checkSourceView = function() {
         return false;
      };
      // TODO Handle non visible windows ?
      this.checkResultView = function() {
         // Assume that the resulting view is the main view of the active ImageWindow
         this.resultPrimaryView = this.environment.getCurrentView();
         if (this.resultPrimaryView === null) {
            // If there is no current view, the process may have generated a file, or
            // the current view before the process was started is still the active one.
            // Now check for the first case
            return "ERROR: Process did not result in a valid active window, cannot identify resulting view";
         }
         this.resultViews = this.environment.getAdditionalMainViewsExcept(this.viewsUniqueIdsBeforeProcess);
         Console.writeln("Generated views: ", (this.resultViews.map(function(v){return v.fullId})).join(","));
         if (this.resultViews.length == 0) {
            // At least the resultPrimaryView should be in the list, except if it was also
            // the current view before the execution.
            return "ERROR: Process did not create a valid active window, possibly it created only files, result cannot be saved by VaryParams";
         }
         // Rename nicely
         for (var i=0; i<this.resultViews.length; i++) {
            var mainView = this.resultViews[i];
            var id = mainView.id;
            id = id + "_" + this.outputIndex;
            mainView.id = id;
         }

         return false;
      }
   },

   // -- Select output disposal method

   // New images are created in the workspace from the original image or globally
   setKeepViewInWorkspace: function setKeepViewInWorkspace() {

      // Keep track of the results with the main view first
      this.saveResultView = function() {
         var resultList = new Array;
         resultList.push(this.resultPrimaryView.fullId);
         for (var i=0; i<this.resultViews.length; i++) {
            if (this.resultPrimaryView.uniqueId !== this.resultViews[i].uniqueId) {
               resultList.push(this.resultViews[i].fullId);
            }
         }
         this.generatedResults.push(resultList);
         return false;
      };

      // Log the result
      this.complete = function complete() {
         Console.writeln();
         var count = 0;
         for (var i=0; i<this.generatedResults.length; i++) {
            count += this.generatedResults[i].length;
         }
         if (this.sourceView == null) {
            Console.writeln("Generated " + count + " windows with main views:");
         } else {
            Console.writeln("Generated " + count + " windows from view " + this.sourceView.fullId + " with main views:");
         }
         var paramColLen = vP_findMinColWidth(this.parameterToVary, this.parameterValues, 60);
         Console.writeln("   #  ", vP_padLeftTruncated(this.parameterToVary,paramColLen)," - window main view");
         for (var i=0; i<this.generatedResults.length; i++) {
            var resultList = this.generatedResults[i];
            // Primary result
            Console.writeln(format("%4d: ", (i+1)),vP_padLeftTruncated(""+this.parameterValues[i],paramColLen), " - ", resultList[0]);
            // Other results
            for (var j=1;j<resultList.length; j++) {
               // other visible views generated
               Console.writeln("      ", vP_padLeftTruncated("",paramColLen), " - ", resultList[j]);
            }
         }
         Console.writeln();
         return false;
      }
   },

   // The updated/created images are saved as file and closed
   setSaveViewAsFile: function setSaveViewAsFile(directory, overwriteOutputFiles) {

      this.saveResultView = function() {

         // TODO Support saving all view even if no primary view
         if (this.resultPrimaryView == null) {
            return "ERROR: No primary view to save (the process did not create a window with focus)";
         }
         if (this.resultViews.length > 1) {
            Console.writeln("Warning: The process generated multiple views, only the primary result '" + this.resultPrimaryView.fullId +"' will be saved");
         }
         var resultList = new Array;
         for (var i=0; i<this.resultViews.length; i++) {
            var resultWindow = this.resultViews[i].window;
            var resultViewId = resultWindow.mainView.fullId;
#ifdef DEBUG
          Console.writeln("setSaveViewAsFile.saveResultView: Result ", (i+1), " view ID: " , this.resultPrimaryView);
#endif
            // TODO Generate name based on source view, parameter, value,...
            var fileName = directory + "/" +  resultViewId  + ".fits";
            resultWindow.saveAs(fileName, false, true, true, !overwriteOutputFiles); // fileName [, Boolean queryOptions=true[, Boolean allowMessages=true[, Boolean strict=true[, Boolean verifyOverwrite=true]]]] )
            resultList.push(fileName);
         }
         this.generatedResults.push(resultList);

#ifdef DEBUG
         Console.writeln("setSaveViewAsFile.saveResultView: Closing windows ");
#endif
         // Close all result window
         for (var i=0; i<this.resultViews.length; i++) {
            var w = this.resultViews[i].window;
            this.environment.forceCloseWindow(w);
         }
         return false;
      };

      this.complete = function complete() {
         Console.writeln();
         if (this.sourceView == null) {
            Console.writeln("Generated ",this.generatedResults.length+ " files in ", directory + ": ");
         } else {
            Console.writeln("Generated ",this.generatedResults.length+ " files from view " + this.sourceView.fullId + " in " + directory, ": ");
         }
         var paramColLen = vP_findMinColWidth(this.parameterToVary, this.parameterValues, 60);

         Console.writeln("   #  ", vP_padLeftTruncated(this.parameterToVary,paramColLen)," - file");
         for (var i=0; i<this.generatedResults.length; i++) {
            var resultList = this.generatedResults[i];
            Console.writeln(format("%4d: ", (i+1)),vP_padLeftTruncated(""+this.parameterValues[i],paramColLen), " - ", vP_TruncateLongFileNames(resultList[0],60));
            for (var j=1;j<resultList.length; j++) {
               // other files generated
               Console.writeln("      ", vP_padLeftTruncated("",paramColLen), " - ", vP_TruncateLongFileNames(resultList[j],60));
            }
         }
         Console.writeln("You may load them in Blink from the directory '" +directory + "'");
         Console.writeln();
         return false;
      }
    },

   // The copied and updated images must be previews of the current view
   setSaveViewAsPreview: function setSaveViewAsPreview(deleteOtherPreviews) {

      if (deleteOtherPreviews) {
         this.initialize = function() {
            var workWindow = this.sourceView.window;
#ifdef DEBUG
            Console.writeln("Deleting previews of ", workWindow.fullId);
#endif
            //TODO May use deletePreviews if this is a main view
            var previews = workWindow.previews;
            for (var i=0; i<previews.length; i++) {
               var p = previews[i];
               if (this.sourceView.uniqueId !== p.uniqueId) {
                  workWindow.deletePreview(p);
               }
            }
           return false;
         };
      } else {
         this.initialize = function() {
            return false;
         };

      }

      this.prepareWorkView = function() {
         var workWindow = this.sourceView.window;


         if (this.sourceView.isPreview) {
            var rect = this.sourceView.window.previewRect(this.sourceView);
         } else {
            var rect = this.sourceView.image.bounds;
         }
         var previewId = this.makePreviewId();
         this.workView = workWindow.createPreview(rect, previewId);
#ifdef DEBUG
         Console.writeln("prepareWorkView: Created preview: ",this.workView.fullId, ", bounds: " , rect, " from ", this.sourceView.fullId);
#endif
         return false;
      };
      // Must overload to check that no other view were generated
      this.checkResultView = function() {
         var additonalViews = this.environment.getAdditionalMainViewsExcept(this.viewsUniqueIdsBeforeProcess);
         if (additonalViews.length > 0) {
           throw "This process generated new views, not suitable to use with Previews";
         }

         this.resultPrimaryView = this.workView;
         Console.writeln( this.processInstanceName, " worked on the preview: ", this.resultPrimaryView.fullId);

         this.resultViews = [this.resultPrimaryView];

         return false;
      }

      // TODO Check that no other view were generated
      this.saveResultView = function() {
         this.generatedResults.push(this.resultPrimaryView.fullId);
         return false;
      };

      this.complete = function complete() {

         Console.writeln();
         if (this.sourceView.isMainView) {
            Console.writeln("Added " + this.generatedResults.length + " previews to window " + this.sourceView.fullId + ":");
         } else {
            Console.writeln("Added " + this.generatedResults.length + " previews to window " + this.sourceView.window.mainView.fullId + " from view " + this.sourceView.fullId + ":");
         }
         var paramColLen = vP_findMinColWidth(this.parameterToVary, this.parameterValues, 60);
         Console.writeln("   #  ", vP_padLeftTruncated(this.parameterToVary,paramColLen)," - preview");
         for (var i=0; i<this.generatedResults.length; i++) {
            Console.writeln(format("%4d: ", (i+1)),vP_padLeftTruncated(""+this.parameterValues[i],paramColLen), " - ", this.generatedResults[i]);
         }
         Console.writeln("Use Ctrl+Right and Ctrl+Left to navigate");
         Console.writeln();
         return false;
      }
   },

  // TODO Add case of SetNoResult (side effect)

   // -- Set the parameters to operate upon
   setParameters: function setParameters(name, values) {
      this.parameterToVary = name;
      this.parameterValues = values;
   },


   // -- Support methods
   makePreviewId: function () {
      // TODO if source is a preview rather than a view, should be used as part of the id
      return this.processInstanceName + "_" + this.outputIndex;
   },
   makeNewViewId: function () {
      // TODO if source is a preview rather than a view, should be used as part of the id
      return this.sourceView.id + "_" + this.processInstanceName; // TODO Is OK?  + "_" + this.outputIndex;
   }

}

Vp_VaryProcessEngine.prototype = vP_ProcessEnginePrototype;



// ----------------------------------------------------------------------------------------------------------------------
// Entry point for execution
// ----------------------------------------------------------------------------------------------------------------------

// Execute a paremeterized process on a view for all values of a single parameter,
// save the results. Return false in case of success, an error text otherwise
function vP_executeForAllValues(varyProcessEngine) {

   var error = varyProcessEngine.initialize();
   if (error) {
      Console.writeln(error);
      Console.writeln("** VaryParams: Cannot initialize, see last error.");
      return error;
   }

   for (var i=0; i<varyProcessEngine.parameterValues.length; i++) {

      // TODO Is it useful?
      Console.abortEnabled = true;
      processEvents();
      if ( Console.abortRequested ) {
         throw "Process aborted";
      }

      error = varyProcessEngine.prepareNextProcess() ||
         varyProcessEngine.prepareWorkView() ||
         varyProcessEngine.executeProcess() ||
         varyProcessEngine.checkSourceView() ||
         varyProcessEngine.checkResultView() ||
         varyProcessEngine.saveResultView();

      if (error) {
         Console.writeln(error);
         Console.writeln("** VaryParams: Interrupting execution " + (i+1) + " due to error in last process, look at the log.");
         return error;
      }

      // Explicit call to gc() in each loop, hopefully to release unused images
      // May jsAutoGC could be used in main
      gc();


   }
   return varyProcessEngine.complete()
}


// ----------------------------------------------------------------------------------------------------------------------
// Support methods (TODO could be moved in Vp_VaryProcessEngine)
// ----------------------------------------------------------------------------------------------------------------------

// Create an instance of a parameterized process and execute it on the specified view with the specified parameter
function vP_executeOnView(view, processInstanceName, paramName,  paramValue) {
   if (view.isNull || !view.window.isValidView(view)) {
      throw "vP_executeOnView: InvalidView";
   }
   var masked = (view.window.maskEnabled && !view.window.mask.isNull) ? (("masked("+ view.window.mask.mainView.fullId +")" + (view.window.maskInverted ? "-inverted" : ""))) : "not masked";
   Console.writeln("Execute process '", processInstanceName, "' on view : ", view.fullId, " ", masked, ", with parameter: ", paramName, " = " , paramValue);

   var processInstance = vP_makeParameterizedProcessInstance(processInstanceName, paramName, paramValue);

   var result = false;
   try {
       result = processInstance.executeOn(view);
   } catch (e) {
      Console.writeln("Error executing process: " + e);
      return false;
   }
#ifdef DEBUG
   Console.writeln("vP_executeOnView: result: ", result);
#endif
   return result;
}


// Execute globally
function vP_executeGlobally(processInstanceName, paramName,  paramValue) {
   Console.writeln("Execute process '", processInstanceName, "' globally with parameter:", paramName, " = " , paramValue);

   var processInstance = vP_makeParameterizedProcessInstance(processInstanceName, paramName, paramValue);

   var result = false;
   try {
      result = processInstance.executeGlobal()
   } catch (e) {
      Console.writeln("Error executing process: " + e);
      return false;
   }
#ifdef DEBUG
   Console.writeln("vP_executeGlobally: result: ", result);
#endif
   return result;
}

// ****************************************************************************
// EOF VaryParams-engine.jsh - Released 2013/12/03 16:15:08 UTC
