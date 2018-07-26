$(document).ready(function () {

	/*-----------------------------------/
	/*	SIDEBAR NAVIGATION
	/*----------------------------------*/

	$('.sidebar a[data-toggle="collapse"]').on('click', function (e) {
		e.preventDefault();
	});


	/*-----------------------------------/
	/*	CONTENT MENU
	/*----------------------------------*/

	if ($('.content-menu').length > 0) {
		$('.btn-open-content-menu').on('click', function () {
			$('.content-menu-left').css('left', 0);
		});

		$('.btn-close-content-menu').on('click', function () {
			$('.content-menu-left').css('left', -300);
		});

		$('.inbox-list-message > li').on('click', function () {
			$('.content-right').show('medium');
		});

		$('.btn-close-content-right').on('click', function () {
			$('.content-right').hide('medium');
		});
	}


	/*-----------------------------------/
	/*	PANEL FUNCTIONS
	/*----------------------------------*/

	// panel remove
	$('.panel .btn-remove').click(function (e) {

		e.preventDefault();
		$(this).parents('.panel').fadeOut(300, function () {
			$(this).remove();
		});
	});

	// panel collapse/expand
	var affectedElement = $('.panel-body');

	$('.panel .btn-toggle-collapse').clickToggle(
		function (e) {
			e.preventDefault();

			// if has scroll
			if ($(this).parents('.panel').find('.slimScrollDiv').length > 0) {
				affectedElement = $('.slimScrollDiv');
			}

			$(this).parents('.panel').find(affectedElement).slideUp(300);
			$(this).find('i').toggleClass('fa-minus fa-plus');
		},
		function (e) {
			e.preventDefault();

			// if has scroll
			if ($(this).parents('.panel').find('.slimScrollDiv').length > 0) {
				affectedElement = $('.slimScrollDiv');
			}

			$(this).parents('.panel').find(affectedElement).slideDown(300);
			$(this).find('i').toggleClass('fa-minus fa-plus');
		}
	);

	// panel refresh
	if ($('.btn-panel-refresh').length > 0) {
		$('.btn-panel-refresh').on('click', function () {
			$('.overlay-refresh').fadeIn(300);

			setTimeout(function () {
				$('.overlay-refresh').fadeOut(300);
			}, 1500);
		});
	}


	/*-----------------------------------/
	/*	PANEL SCROLLING
	/*----------------------------------*/

	if ($('.panel-scrolling').length > 0) {
		$('.panel-scrolling .panel-body').slimScroll({
			height: '430px',
			wheelStep: 2,
			color: 'rgba(160, 174, 186, .4)'
		});
	}

	if ($('#panel-scrolling-demo').length > 0) {
		$('#panel-scrolling-demo .panel-body').slimScroll({
			height: '150px',
			wheelStep: 2,
			color: 'rgba(160, 174, 186, .4)'
		});
	}


	/*-----------------------------------/
	/*	PANEL QUICK NOTE
	/*----------------------------------*/

	if ($('.quick-note-create').length > 0) {
		$('.quick-note-create textarea, .quick-note-create input').on('focusin', function () {
			$(this).attr('rows', 7);
			$('.panel-quick-note').find('.panel-footer').show();
		});

		$('.quick-note-create').on('focusout', function () {
			$(this).find('textarea').attr('rows', 1);
			$(this).find('.panel-footer').hide();
		});
	}

	if ($('.quick-note').length > 0) {
		$('.quick-note').on('click', function () {
			$('#quick-note-modal').modal();
		});
	}

	if ($('.quick-note-edit').length > 0) {
		$('.quick-note-edit .btn-save').on('click', function () {
			$('#quick-note-modal').modal('hide');
		});
	}


	/*-----------------------------------/
	/*	TODO LIST
	/*----------------------------------*/

	$('.todo-list input').change(function () {
		if ($(this).prop('checked')) {
			$(this).parents('li').addClass('completed');
		} else {
			$(this).parents('li').removeClass('completed');
		}
	});


	/*-----------------------------------/
	/* TOASTR NOTIFICATION
	/*----------------------------------*/

	if ($('#toastr-demo').length > 0) {
		toastr.options.timeOut = "false";
		toastr.options.closeButton = true;
		toastr['info']('Hi there, this is notification demo with HTML support. So, you can add HTML elements like <a href="#">this link</a>');

		$('.btn-toastr').on('click', function () {
			$context = $(this).data('context');
			$message = $(this).data('message');
			$position = $(this).data('position');

			if ($context === '') {
				$context = 'info';
			}

			if ($position === '') {
				$positionClass = 'toast-left-top';
			} else {
				$positionClass = 'toast-' + $position;
			}

			toastr.remove();
			toastr[$context]($message, '', {
				positionClass: $positionClass
			});
		});

		$('#toastr-callback1').on('click', function () {
			$message = $(this).data('message');

			toastr.options = {
				"timeOut": "300",
				"onShown": function () {
					alert('onShown callback');
				},
				"onHidden": function () {
					alert('onHidden callback');
				}
			};

			toastr['info']($message);
		});

		$('#toastr-callback2').on('click', function () {
			$message = $(this).data('message');

			toastr.options = {
				"timeOut": "10000",
				"onclick": function () {
					alert('onclick callback');
				},
			};

			toastr['info']($message);

		});

		$('#toastr-callback3').on('click', function () {
			$message = $(this).data('message');

			toastr.options = {
				"timeOut": "10000",
				"closeButton": true,
				"onCloseClick": function () {
					alert('onCloseClick callback');
				}
			};

			toastr['info']($message);
		});
	}


	/*-----------------------------------/
	/* BOOTSTRAP TOOLTIP INIT
	/*----------------------------------*/

	if ($('[data-toggle="tooltip"]').length > 0) {
		$('[data-toggle="tooltip"]').tooltip();
	}

});

// toggle function
$.fn.clickToggle = function (f1, f2) {
	return this.each(function () {
		var clicked = false;
		$(this).bind('click', function () {
			if (clicked) {
				clicked = false;
				return f2.apply(this, arguments);
			}

			clicked = true;
			return f1.apply(this, arguments);
		});
	});

};