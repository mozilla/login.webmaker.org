/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

Array.uniqueSort = function(a) {
  a.sort();

  for (var i = 1; i < a.length; i++){
    if(a[i] === a[i-1]){
      a.splice(i--, 1);
    }
  }
  
  return a;
};
