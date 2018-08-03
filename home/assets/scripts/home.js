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

    $("form").submit(function (event) {
        event.preventDefault(); //prevent default action 
        var post_url = $(this).attr("action"); //get form action url
        var request_method = $(this).attr("method"); //get form GET/POST method
        var form_data = new FormData()

        try {
            var datasetFile = $(this).find("#file-dataset")[0].files[0];
            form_data.append("file-dataset", datasetFile, datasetFile.name);
        } catch (error) {
            console.log(error)
        }

        try {
            var labelsFile = $(this).find("#file-labels")[0].files[0];
            form_data.append("file-labels", labelsFile, labelsFile.name);
        } catch (error) {
            console.log(error)
        }

        var fields = $(this).serializeArray();
        for (i = 0; i < fields.length; i++) {
            form_data.append(fields[i].name, fields[i].value);
        }

        var xhr = new XMLHttpRequest();
        xhr.open(request_method, post_url, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log("yolo");
            } else {}
        };
        xhr.send(form_data);
    });

    $("form").submit();
}

function nextStep() {
    $("input[name='datasetName']").val($("#file-dataset")[0].files[0].name.split(".")[0]);
    $("input[name='datasetPoints']").val(checkSum[0]);
    if (checkSum[0] < 100) {
        $("input[name='datasetMaxMpts']").attr("value", checkSum[0]);
    } else {
        $("input[name='datasetMaxMpts']").attr("value", 100);
    }

    $.validate({
        modules: 'logic,toggleDisabled',
        showErrorDialogs: false
    });

    $("#submitDataForm").validate();

}

var modal = $('#addDataModal').modalSteps({
    btnLastStepHtml: "Run",
    btnPreviousHtml: "Back",
    completeCallback: submitData,
    callbacks: {
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
            }

            function resetFile(id) {
                drEvent.resetPreview();
                drEvent.clearElement();
                $('.dropify-wrapper').has("#" + id).toggleClass("has-error")
            }

            if (errors.length > 0) {
                resetFile(id);
                return false;

            }

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