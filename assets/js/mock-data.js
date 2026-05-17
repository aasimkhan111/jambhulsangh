(function () {
  var categories = ["राजापुरी", "जांभूळ काळी", "फुलजांभूळ", "गोमंतकी", "पारजांभूळ", "लोकल"];
  var statuses = ["Active", "Review", "New", "Pending"];
  var locations = ["सातारा", "कोल्हापूर", "सांगली", "रत्नागिरी", "पुणे", "सिंधुदुर्ग"];
  var owners = ["राजेश पाटील", "सुनील जाधव", "मंगेश शिंदे", "अनिल कदम", "प्रकाश मोरे", "सचिन गायकवाड"];
  var stages = ["विक्री", "स्वतः साठी", "होलसेल", "निर्यात", "प्रक्रिया", "ठेका"];

  var rows = Array.from({ length: 28 }, function (_, index) {
    var createdAt = new Date(Date.now() - index * 22 * 60 * 60 * 1000);
    var category = categories[index % categories.length];
    var status = statuses[index % statuses.length];
    var treeCount = 50 + index * 12;

    return {
      Title: owners[index % owners.length],
      Category: category,
      Status: status,
      "Tree Count": String(treeCount),
      "Farm Area": (5 + index) + " Acres",
      "Soil Type": index % 2 === 0 ? "Loam & Volcanic Ash" : "Clay & Sandy",
      "Rating": (4 + (index % 10) / 10).toFixed(1),
      "Reviews": (10 + index * 5).toString(),
      "Phone": "+9198" + (10000000 + index).toString().slice(-8),
      Date: createdAt.toISOString().slice(0, 10),
      Location: locations[index % locations.length],
      Owner: owners[index % owners.length],
      Stage: stages[index % stages.length],
      Summary:
        locations[index % locations.length] + " - " + category + " जांभूळ शेती, " + treeCount + " झाडे",
      Image: (index % 14 + 1) + ".jpeg",
    };
  });

  var headers = Object.keys(rows[0]);
  var values = [headers].concat(
    rows.map(function (row) {
      return headers.map(function (header) {
        return row[header];
      });
    })
  );

  window.KF_PREVIEW_SHEET = {
    values: values,
  };
})();
