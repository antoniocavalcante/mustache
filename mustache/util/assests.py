from flask_assets import Bundle, Environment
from .. import app


bundles = {

    'home_js': Bundle(
        "vendor/jquery/jquery.min.js",
        "vendor/form-validator/jquery.form-validator.min.js",
        "vendor/bootstrap/js/bootstrap.min.js",
        "vendor/bootstrap-progressbar/js/bootstrap-progressbar.min.js",
        "vendor/jquery.easy-pie-chart/jquery.easypiechart.min.js",
        "vendor/dropify/js/dropify.min.js",
        "js/home/jquery-bootstrap-modal-steps.min.js",
        "vendor/sweetalert2/sweetalert2.js",
        "js/home/mfb.js",
        "js/home/klorofilpro-common.js",
        "js/home/papaparse.min.js",
        "js/home/home.js",
        output='gen/home.js', filters="jsmin"),

    'home_css': Bundle(
        "vendor/bootstrap/css/bootstrap.min.css",
        "vendor/font-awesome/css/font-awesome.min.css",
        "vendor/linearicons/style.css",
        "vendor/themify-icons/css/themify-icons.css",
        "vendor/bootstrap-progressbar/css/bootstrap-progressbar-3.3.4.min.css",
        "vendor/sweetalert2/sweetalert2.css",
        "vendor/dropify/css/dropify.min.css",
        "css/home/mfb.css",
        "css/home/main.css",
        "css/home/style.css",
        "css/home/loaders.css",
        "css/dashboard/dashboard.css",
        "css/font.css",
        output='gen/home.css', filters="cssrewrite"),

    'dashboard_js': Bundle(
        'js/dashboard/lodash.min.js',
        'js/dashboard/underscore.js',
        "vendor/jquery/jquery.min.js",
        'js/dashboard/d3.v4.js',
        'js/dashboard/d3-array.v1.min.js',
        'js/dashboard/d3-scale-chromatic.v1.js',
        'js/dashboard/d3-drag.v1.min.js',
        "vendor/bootstrap/js/bootstrap.min.js",
        'vendor/jquery-slimscroll/jquery.slimscroll.min.js',
        'js/dashboard/klorofil-2.js',
        'js/dashboard/tippy.all.min.js',
        'js/dashboard/layout.js',
        'js/dashboard/myplots.js',
        'js/dashboard/reach.js',
        'js/dashboard/info.js',
        output='gen/dashboard.js', filters="jsmin"),

    'dashboard_css': Bundle(
        "vendor/bootstrap/css/bootstrap.min.css",
        'css/dashboard/all.css',
        "vendor/linearicons/style.css",
        "vendor/themify-icons/css/themify-icons.css",
        'css/dashboard/animate.css',
        'css/dashboard/main.css',
        "css/dashboard/dashboard.css",
        "css/dashboard/sidebar-nav-darkblue.css",
        'css/dashboard/loader.css',
        'css/dashboard/range.css',
        "css/font.css",
        output='gen/dashboard.css',  filters="cssrewrite")
}

assets = Environment(app)
assets.register(bundles)
