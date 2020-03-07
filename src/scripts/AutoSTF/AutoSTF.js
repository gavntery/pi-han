/*
 * AutoSTF
 *
 * A simple script to apply automatic screen transfer functions (STF) to all
 * open images.
 *
 * Copyright (C) 2010-2013, Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Utilities > AutoSTF

#feature-info  A script that applies automatic screen transfer functions (STF) \
   to all open images.<br/>\
   <br/>\
   Written by Juan Conejero (PTeam)<br/>\
   Copyright (C) 2010-2013 Pleiades Astrophoto

/*
 * Default STF Parameters
 */

// Shadows clipping point in (normalized) MAD units from the median.
#define DEFAULT_AUTOSTRETCH_SCLIP  -2.80
// Target mean background in the [0,1] range.
#define DEFAULT_AUTOSTRETCH_TBGND   0.25
// Apply the same STF to all nominal channels (true), or treat each channel
// separately (false).
#define DEFAULT_AUTOSTRETCH_CLINK   true

/*
 * Find a midtones balance value that transforms v1 into v0 through a midtones
 * transfer function (MTF), within the specified tolerance eps.
 *
 * ### This routine is no longer used - See the following forum thread for more
 * information:
 *    http://pixinsight.com/forum/index.php?topic=2116
 */
 /*
function findMidtonesBalance( v0, v1, eps )
{
   if ( v1 <= 0 )
      return 0;

   if ( v1 >= 1 )
      return 1;

   v0 = Math.range( v0, 0.0, 1.0 );

   if ( eps )
      eps = Math.max( 1.0e-15, eps );
   else
      eps = 5.0e-05;

   var m0, m1;
   if ( v1 < v0 )
   {
      m0 = 0;
      m1 = 0.5;
   }
   else
   {
      m0 = 0.5;
      m1 = 1;
   }

   for ( ;; )
   {
      var m = (m0 + m1)/2;
      var v = Math.mtf( m, v1 );

      if ( Math.abs( v - v0 ) < eps )
         return m;

      if ( v < v0 )
         m1 = m;
      else
         m0 = m;
   }
}
 */

/*
 * STF Auto Stretch routine
 */
function ApplyAutoSTF( view, shadowsClipping, targetBackground, rgbLinked )
{
   var stf = new ScreenTransferFunction;

   var n = view.image.isColor ? 3 : 1;

   var median = view.computeOrFetchProperty( "Median" );

   var mad = view.computeOrFetchProperty( "MAD" );
   mad.mul( 1.4826 ); // coherent with a normal distribution

   if ( rgbLinked )
   {
      /*
       * Try to find how many channels look as channels of an inverted image.
       * We know a channel has been inverted because the main histogram peak is
       * located over the right-hand half of the histogram. Seems simplistic
       * but this is consistent with astronomical images.
       */
      var invertedChannels = 0;
      for ( var c = 0; c < n; ++c )
         if ( median.at( c ) > 0.5 )
            ++invertedChannels;

      if ( invertedChannels < n )
      {
         /*
          * Noninverted image
          */
         var c0 = 0, m = 0;
         for ( var c = 0; c < n; ++c )
         {
            if ( 1 + mad.at( c ) != 1 )
               c0 += median.at( c ) + shadowsClipping * mad.at( c );
            m  += median.at( c );
         }
         c0 = Math.range( c0/n, 0.0, 1.0 );
         m = Math.mtf( targetBackground, m/n - c0 );

         stf.STF = [ // c0, c1, m, r0, r1
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
      else
      {
         /*
          * Inverted image
          */
         var c1 = 0, m = 0;
         for ( var c = 0; c < n; ++c )
         {
            m  += median.at( c );
            if ( 1 + mad.at( c ) != 1 )
               c1 += median.at( c ) - shadowsClipping * mad.at( c );
            else
               c1 += 1;
         }
         c1 = Math.range( c1/n, 0.0, 1.0 );
         m = Math.mtf( c1 - m/n, targetBackground );

         stf.STF = [ // c0, c1, m, r0, r1
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
   }
   else
   {
      /*
       * Unlinked RGB channnels: Compute automatic stretch functions for
       * individual RGB channels separately.
       */
      var A = [ // c0, c1, m, r0, r1
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1] ];

      for ( var c = 0; c < n; ++c )
      {
         if ( median.at( c ) < 0.5 )
         {
            /*
             * Noninverted channel
             */
            var c0 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) + shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 0.0;
            var m  = Math.mtf( targetBackground, median.at( c ) - c0 );
            A[c] = [c0, 1, m, 0, 1];
         }
         else
         {
            /*
             * Inverted channel
             */
            var c1 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) - shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 1.0;
            var m  = Math.mtf( c1 - median.at( c ), targetBackground );
            A[c] = [0, c1, m, 0, 1];
         }
      }

      stf.STF = A;
   }

   console.writeln( "<end><cbr/><br/><b>", view.fullId, "</b>:" );
   for ( var c = 0; c < n; ++c )
   {
      console.writeln( "channel #", c );
      console.writeln( format( "c0 = %.6f", stf.STF[c][0] ) );
      console.writeln( format( "m  = %.6f", stf.STF[c][2] ) );
      console.writeln( format( "c1 = %.6f", stf.STF[c][1] ) );
   }

   stf.executeOn( view );

   console.writeln( "<end><cbr/><br/>" );
}

function main()
{
   console.show();
   var images = ImageWindow.windows;
   for ( var i in images )
   {
      processEvents();
      ApplyAutoSTF( images[i].mainView,
                    DEFAULT_AUTOSTRETCH_SCLIP,
                    DEFAULT_AUTOSTRETCH_TBGND,
                    DEFAULT_AUTOSTRETCH_CLINK );
      processEvents();
   }
}

main();
