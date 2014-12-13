

var snapdeal = (function(){
    var URL = "http://www.maplin.co.uk/c/cctv-and-security";
    var init = function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET',URL)
            xhr.responseType = "document"
           var promise = new Promise(function(resolve,reject){
            xhr.send();
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                    resolve(xhr.response);
                    }
                    else {
                        reject(new Error("Request Completed but with error."));
                    }
                }
            };
            xhr.onerror = function(){
                reject(new Error("There was a network error. Could not initiate an HTTP connection."));
            }
            
        });
        promise.then(function(){
            fetchCategories(xhr.response);
        });
    };
    var fetchCategories = function(response) {
        var filter = ["I.P. CCTV","DVRs (Digital Video Recorders)","Security Systems & Alarms","Covert & Mobile Surveillance","Safes & Locks"];
        var collection = [];
        var categories = $(response).find("#categories > li");
        $.each(categories,function(index,category){
            var url = $(category).find("a").attr("href");
            if(category.innerText.match(/\d/g)) {
            var quantity = category.innerText.match(/\d/g).join('');
            }
            else {
                var quantity = 0;
            }
           // var title = $.trim(category.innerText.substring(0,category.innerText.indexOf("View products")));
             var title = $.trim(category.innerText.substring(0,category.innerText.indexOf(quantity)-1));
            if(filter.indexOf(title) > -1)
            collection.push({title:title,quantity:quantity,url:url});            
        });
        createViewModel(collection);
    };
    
   var createViewModel = function(collection) {
       var vm = (function() {
           var categoryURL = "";
           var products = ko.observableArray(collection);
           var brands = ko.observableArray();
           var productDetails = ko.observableArray();
           var selectedCategory = ko.observable();
           var sortedByPrice = ko.observable(0);
           var sortedByName = ko.observable(0);
           var pagination = ko.observableArray([1,2,3]);
           var xhr = new XMLHttpRequest();
           
           xhr.responseType = "document";
           var fetchBrands = function(index) { 
              $("#noProducts").html("");
               productDetails.removeAll();
               $("progress").removeClass("invisible");
               selectedCategory(index.title);
               xhr.open('GET','http://www.maplin.co.uk' + index.url);
               var promise = new Promise(function(resolve,reject){
                   xhr.send();
                   xhr.onreadystatechange = function(){
                       if(xhr.readyState === 4) {
                           if(xhr.status === 200)
                           {
                               resolve(xhr.response);
                           }
                           else {
                               reject(new Error('Request completed but with error.'));
                           }
                       }
                   };
                   xhr.onerror = function() {
                       reject(new Error("Could not initiate a connection"));
                   }
               });
               promise.then(function() {
                 var brandParagraph = $(xhr.response).find("a[href*='Brand']").parent("p") ;
                   var brandsArr = [];
                   brandParagraph.each(function(index,p) {
                       
                    var brandName = $($(p).children()[0]).text();
                       var quantity = $($(p).children()[1]).text();
                       brandsArr.push({brandName:brandName,quantity:quantity});                       
                   });
                   categoryURL = index.url;
                   brands(brandsArr); 
                   $("#progressBrands").addClass("invisible");
               });
               
           };
           
           var viewSKUs = function() {              
               var xhr = new XMLHttpRequest();
              
               xhr.open('GET','http://www.maplin.co.uk'+categoryURL);
               xhr.responseType = "document";
               sortedByName(0);
               sortedByPrice(0);
               var promise = new Promise(function(resolve,reject){
                   $("#progressDetails").removeClass("invisible");
                   xhr.send();
                   xhr.onreadystatechange = function(){
                       if(xhr.readyState === 4) {
                           if(xhr.status === 200) {
                               resolve(xhr.response);
                           }
                           else {
                               reject(new Error("Request completed but unsuccessfully."))
                           }
                       }
                   };
                   xhr.onerror = function() {
                       reject(new Error("Could not extablish a connection."));
                   }
               });
               promise.then(function() {

                    productDetails.removeAll();
                   var products = $(xhr.response).find("#searchproducts > li");
                   products.each(function(index,product){                      
                       var productName = $(product).find(".tileinfo > h3 > a").text();
                       var sku = $(product).find(".productcode").text().toString().substring(6);
                       var newPrice = $(product).find(".tileinfo").find(".prices > p.new-price").text();  
                       
                      productDetails.push({productName:productName,newPrice:newPrice,sku:sku});
                       
                       $("#progressDetails").addClass("invisible");
                   });
                 if(productDetails().length === 0) {
                     $("#noProducts").html("<b>No Products Found</b>");
                     categoryURL = categoryURL.substring(0,categoryURL.indexOf("?page="));
                 }
                   else $("#noProducts").html("");

               });
           };
           var sortByPrice = function() {
            productDetails.sort(function(left,right){
                return Number(left.newPrice.substring(1)) === Number(right.newPrice.substring(1)) ? 0 : (Number(left.newPrice.substring(1)) < Number(right.newPrice.substring(1)) ? -1 : 1);
            });
               sortedByPrice(1);
               sortedByName(0);
           };
               var sortByName = function() {
            productDetails.sort(function(left,right){
                return left.productName.trim() === right.productName.trim() ? 0 : left.productName.trim() < right.productName.trim() ? -1 : 1;
            });   
                   sortedByName(1);
                   sortedByPrice(0);
           };
           var startPaging = function(index) {
               if(categoryURL.indexOf("?page=") !== -1) {
                   categoryURL = categoryURL.substring(0,categoryURL.indexOf("?page="));
               }
               categoryURL += "?page=" + index;
               viewSKUs();
           };
           var saveProductDetails = function() {
               var data = JSON.stringify([products(),productDetails(),brands()]);
               window.open('data:text/json;charset=utf8,' + encodeURIComponent(data),'_blank');
               window.focus();
           };
           
           return {
               products:products,
               fetchBrands:fetchBrands,
               selectedCategory:selectedCategory,
               brands:brands,
               viewSKUs:viewSKUs,
               productDetails:productDetails,
               sortByPrice:sortByPrice,
               sortByName:sortByName,
               sortedByName:sortedByName,
               sortedByPrice:sortedByPrice,
               pagination:pagination,
               startPaging:startPaging,
               saveProductDetails:saveProductDetails
           };
       })();
       $("#progressCategories").css("display","none");
       $("#products").css("display","block");
       ko.applyBindings(vm,$("#products")[0]);
   }
    return {
        init:init
    };
})();

