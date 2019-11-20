$(function () {

    $("#workspace").on("show.bs.modal", function (e) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/workspace", true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var path = JSON.parse(xhr.response)['path']
                $("#dirPath").val(path)
            } else {

            }
        };
        xhr.send();
    })

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/workspace", true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var path = JSON.parse(xhr.response)['path']
            $("#dirPath").val(path)
        } else {
            $("#workspace").modal();
        }
    };
    xhr.send();

    $("#selectDir").click(function () {
        xhr.open("GET", "/directory", true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                $("#dirPath").val(xhr.response)
            } else {

            }
        };
        xhr.send();
    })

    $("#setWorkspace").submit(function (event) {
        event.preventDefault();
        var post_url = $(this).attr("action")
        var request_method = $(this).attr("method");

        var xhr = new XMLHttpRequest();
        xhr.open(request_method, post_url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        var json = {
            "path": $("#dirPath").val()
        }
        xhr.send(JSON.stringify(json));
        xhr.onload = function () {
            if (xhr.status === 200) {
                location.reload()
            } else {

            }
        };

    });
})


$(function () {

    $('.easy-pie-chart').easyPieChart({
        animate: 2000, size: 64, lineCap: "sqaure", lineWidth: 5, scaleColor: false, barColor: "#097B43", trackColor: "#eeeeee"
    });

    var sources = $(".dataset")

    function getStatus(id) {
        var datasetRequest = new XMLHttpRequest();
        datasetRequest.open("GET", "/status/" + id, true);
        datasetRequest.onload = function () {
            if (datasetRequest.status === 200) {
                var state = JSON.parse(datasetRequest.response)
                var d = $("#" + id)

                if (state['stage'] == 'meta-clustering' && state['state']['current'] == 1) {

                    d.find(".stage").hide()
                    d.find(".stage-message").hide()
                    d.find(".lds").hide()

                    d.find(".controls").find("a").toggleClass("hidden")
                    d.find(".controls").find("button").removeAttr("disabled")


                } else {

                    d.find(".stage").text(state['stage'].toUpperCase())
                    d.find(".stage-message").text(state['message'])

                    if (state['state']['end'] == 1) {
                        if (state['stage'] == 'meta-clustering') {

                            d.find(".progress-chart").addClass("hidden")
                            d.find(".lds-meta").removeClass("hidden")

                        } else if (state['stage'] == 'rng') {

                            d.find(".lds-core").addClass("hidden")
                            d.find(".lds-rng").removeClass("hidden")

                        } else if (state['stage'] == 'core-distances') {

                            d.find(".lds-core").removeClass("hidden")

                        }
                    }

                    if (state['stage'] == 'hierarchies') {

                        d.find(".lds-rng").addClass("hidden")
                        d.find(".progress-chart").removeClass("hidden")

                        var n = state['state']['current']
                        var denom = state['state']['end']
                        var percent = ((n / denom) * 100).toFixed(0)
                        d.find(".easy-pie-chart").data('easyPieChart').update(percent);
                        d.find(".easy-pie-chart").find(".percent").text(percent + "%")
                    }

                    setTimeout(function () {
                        getStatus(id);
                    }, 2000);
                }

            } else {

            }
        };
        datasetRequest.send();

    }

    sources.each(function () {
        if (!$(this).data("processed")) {
            getStatus($(this).attr("id"));
        }
    })


})

$(function () {

    $('.btn-sw-confirmation').on('click', function () {
        var id = $(this).data("val")
        swal({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F9354C',
            cancelButtonColor: '#41B314',
            confirmButtonText: 'Yes, delete it!'
        }).then(function () {

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/delete/" + id, true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    swal(
                        'Deleted!',
                        'Your file has been deleted.',
                        'success'
                    );
                    // setTimeout(function () { $("#" + id).remove() }, 2000);
                    $("#" + id).fadeOut("normal", function () {
                        $(this).remove();
                    });
                } else {
                    swal.noop;
                }
            };
            xhr.send();


        }).catch(swal.noop);
    });

})



$(function () {

    var distanceRequest = new XMLHttpRequest();
    distanceRequest.open("GET", "/distance", true);
    distanceRequest.onload = function () {
        if (distanceRequest.status === 200) {
            var distances = JSON.parse(distanceRequest.response)
            var select = $('select[name="datasetDistance"]');
            distances.forEach(function (key) {
                select.append($('<option />', {
                    value: key,
                    text: key.replace(/^\w/, c => c.toUpperCase())
                }));
            })

        } else {

        }
    };
    distanceRequest.send();

    var rngRequest = new XMLHttpRequest();
    rngRequest.open("GET", "/rng", true);
    rngRequest.onload = function () {
        if (rngRequest.status === 200) {
            var rngs = JSON.parse(rngRequest.response)
            var select = $('select[name="datasetRng"]');
            rngs.forEach(function (key) {
                select.append($('<option />', {
                    value: key[0],
                    text: key[0].replace(/^\w/, c => c.toUpperCase())
                }));
            })

        } else {

        }
    };
    rngRequest.send();


})




$(function () {

    var drEvent = $('.dropify').dropify({
        messages: {
            'default': 'Drag and drop a file here or click',
            'replace': 'Drag and drop or click to replace',
            'remove': 'Remove',
            'error': 'Parsing Error.'
        }
    });

    var drEvent3 = $('#file-labels').dropify();
    drEvent3.on('dropify.afterClear', function (event, element) {
        checkSum[1] = undefined;
    });

    var drEvent2 = $('#file-dataset').dropify();
    drEvent2.on('dropify.afterClear', function (event, element) {
        $("#next1").attr("disabled", true);
        try {
            drEvent3 = drEvent3.data("dropify");
            drEvent3.resetPreview();
            drEvent3.clearElement();
        } catch (error) {
            console.log(error);
        }
        checkSum = [];
    });

});

var checkSum = [];

function submitData() {

    console.log("submiited!");

    var form = $("#submitDataForm")

    var post_url = form.attr("action") //get form action url
    var request_method = form.attr("method"); //get form GET/POST method
    var form_data = new FormData()

    try {
        var datasetFile = form.find("#file-dataset")[0].files[0];
        form_data.append("file-dataset", datasetFile, datasetFile.name);
    } catch (error) {
        console.log(error)
    }

    try {
        var labelsFile = form.find("#file-labels")[0].files[0];
        form_data.append("file-labels", labelsFile, labelsFile.name);
    } catch (error) {
        console.log(error)
    }

    var fields = form.serializeArray();
    for (i = 0; i < fields.length; i++) {
        form_data.append(fields[i].name, fields[i].value);
    }

    var xhr = new XMLHttpRequest();
    xhr.open(request_method, post_url, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            location.reload();
        } else {

        }
    };
    xhr.send(form_data);

    // $("form").submit();
}

function startStep() {
    $("#submitDataForm").trigger("reset");
    console.log("Opening data submission form...");
}

function nextStep() {

    var filename = $("#file-dataset")[0].files[0].name

    $("input[name='datasetName']").val(filename);
    $("input[name='datasetPoints']").val(checkSum[0]);
    if (checkSum[0] < 100) {
        $("input[name='datasetMaxMpts']").attr("value", checkSum[0]);
    } else {
        $("input[name='datasetMaxMpts']").attr("value", 100);
    }

    $("input[name='datasetMaxMpts']").attr("data-validation-allowing", "range[" + 1 + ";" + (checkSum[0] - 1) + "]")

    $("input[name='datasetMaxMpts']").on("input", function () {
        $("input[name='datasetMinMpts']").attr("data-validation-allowing", "range[" + 1 + ";" + $(this).val() + "]")
    })

    $("input[name='datasetMinMpts']").on("input", function () {
        $("input[name='datasetMaxMpts']").attr("data-validation-allowing", "range[" + $(this).val() + ";" + (checkSum[0] - 1) + "]")
    })


    $.validate({
        form: '#submitDataForm',
        modules: 'logic,toggleDisabled',
        showErrorDialogs: true
    });

    $("#submitDataForm").isValid();

    $("form").validate(function (valid, elem) {
        console.log(valid, elem);
        if (!valid) {
            $("#next1").attr("disabled", true);
        } else {
            $("#next1").attr("disabled", false);
        }
    })

    $("form").on("validation", function (valid, elem) {
        console.log(valid, elem);
        if (!elem) {
            $("#next1").attr("disabled", true);
        } else {
            $("#next1").attr("disabled", false);
        }
    })


    $("#next1").attr("disabled", true);

}

var modal = $('#addDataModal').modalSteps({
    btnLastStepHtml: "Run",
    btnPreviousHtml: "Back",
    completeCallback: submitData,
    callbacks: {
        "1": startStep,
        "2": nextStep
    }

});

$("#next1").attr("disabled", true);


function check(selection) {
    var labels = selection[0].files[0]
    Papa.parse(labels, {
        complete: function (results) {
            var data = results.data;
            var errors = results.errors;

            var drEvent = selection.dropify();
            drEvent = drEvent.data('dropify');
            var id = selection.attr("id")

            if (id == "file-dataset") {
                checkSum[0] = data.length;
            }
            if (id == "file-labels") {
                checkSum[1] = data.length;
                console.log(data.length);
            }

            function resetFile(id) {
                drEvent.resetPreview();
                drEvent.clearElement();
                $('.dropify-wrapper').has("#" + id).toggleClass("has-error")
            }

            // if (errors.length > 0) {
            //     resetFile(id);
            //     console.log(errors);
            //     return false;
            // }

            if (checkSum.length == 2) {
                if (checkSum[0] != checkSum[1]) {
                    alert("Label Index Error: number of labels does not match number of dataset. ")
                    resetFile(id);
                    return false;
                }
            }
        }
    });

    return true;
}

$(function () {

    $("#dsearch").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $(".dataset").filter(function () {
            $(this).toggle($(this).find(".panel-title").text().toLowerCase().indexOf(value) > -1)
        });
    });

    $("#submitDataForm").find("input[type='file']").change(function (event) {
        var selection = $(this);
        if (selection.attr("id") == "file-dataset") {
            if (check(selection)) {
                $("#next1").removeAttr("disabled");
            }
        }
        if (selection.attr("id") == "file-labels") {
            check(selection);
        }
    })

    $('#addDataModal').on('hidden.bs.modal', function (e) {
        $("#submitDataForm").trigger("reset");
        $('.dropify-wrapper').has("#file-dataset").removeClass("has-error")
        $('.dropify-wrapper').has("#file-labels").removeClass("has-error")
        var d1 = $('#file-dataset').dropify();
        var d2 = $('#file-labels').dropify();
        d1 = d1.data('dropify');
        d2 = d2.data('dropify');
        d1.resetPreview();
        d1.clearElement();
        d2.resetPreview();
        d2.clearElement();
        checkSum = [];
    })

});
