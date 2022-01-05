
// Detect IE ---------------

function isIE () {
    const ua = navigator.userAgent;
    return ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1;
};

const is_IE = !!document.documentMode;

//if(is_IE) $('#ie_warning').show();
if(!isIE()) $('#ie_warning').hide();

// -------------------------

var _region;     // global is the default region

$(document).ready(function () {

    

    // Get provided region from URL
    let searchParams = new URLSearchParams(window.location.search);
    _region = searchParams.get('region');
    if (!_region) {
        _region = localStorage.region || 'global';  // 'global' is the default region
    }
    localStorage.region = _region;  // Sample the region

    // Select project
    _project = (_region == 'cn' ? '2021cn' : '2021');

    if (localStorage.user_name) $('#user_name').val(localStorage.user_name);
    if (localStorage.user_email) $('#user_email').val(localStorage.user_email);
    ValidateInputs();

    $('#video_qualities').hide();

    //window.history.pushState("", "", 'th3preniwacu.html');        // Comment for debug!
});

function OpenSupport() {
    // TODO: Open support URL
    window.open('support.html', 'support');
}

function CloseRegDlg() {
    $('.form').remove();
}

function RenderPlayer(quality) {
    var player = $('#player_template').html().replace('_PROJECT_', _project).replace('_QUALITY_', quality);
    $('#player').html(player);
    RenderQualities(_project, function () {
        HighlightQuality(quality);
    });
}

function HighlightQuality(quality) {
    $('.quality_marker').hide();
    var id = quality.toLowerCase().replace(/ /g, '');
    $('#' + id + '_marker').show();
}

function RenderQualities(project, callback) {
    try {
        fetch(project + '/live.smil')
            .then(response => response.text())
            .then(xml_str => $.parseXML(xml_str))
            .then(xml_doc => $(xml_doc))
            .then(xml => {
                xml.find('video').each(function (index, elem) {
                    var quality = $(elem).attr('agent-data').trim();
                    if (!quality) return;
                    console.log(quality);
                    var id = quality.toLowerCase().replace(/ /g, '');
                    var option = $('#quality_option_template').html().replace(/_QUALITY_/g, quality).replace(/_ID_/g, id);
                    $('#video_qualities').append(option);
                });
                if (callback) callback();
            })
            .catch(error => console.log('RenderQualities: ERROR ' + error.message));
    } catch (error) {
        callback(true);
    }
}

var _hide_timer;

function ToggleQualityMenu() {
    $('#video_qualities').toggle();
    if (_hide_timer) clearTimeout(_hide_timer);
    _hide_timer = setTimeout(() => {
        $('#video_qualities').hide();
    }, 5000);
}

function SelectQuality(quality) {
    localStorage.quality = quality;
    RenderPlayer(quality);
    HighlightQuality(quality);
}

function RenderChat(name) {
    var chat = $('#chat_template').html().replace('_UTM_NAME_', encodeURIComponent(name));
    $('#chat').html(chat);
}

var WELCOME_MESSAGE = 'Welcome _NAME_<br>to the show!';

function ShowWelcomeMessage(name) {
    var message = WELCOME_MESSAGE.replace('_NAME_', name);
    $('#dlg_title').html(message);
    setTimeout(() => {
        $('#user_dlg').hide();
        $('#user_dlg_wrapper').fadeOut();
    }, 2000);
}

function ValidateInputs() {
    $('#message').html('&nbsp;');
    $('#message').removeClass('red');
    var user_email = $('#user_email').val().trim();
    var valid = (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(user_email));
    var user_name = $('#user_name').val().trim();
    valid = valid && (user_name.length >= 3);
    $('.register_btn').removeClass('blue_btn gray_btn');
    $('.support_btn').removeClass('blue_btn gray_btn');
    if (valid) {
        $('.register_btn').addClass('blue_btn');
        $('.support_btn').addClass('gray_btn');
    }
    else {
        $('.register_btn').addClass('gray_btn');
        $('.support_btn').addClass('blue_btn');
    }
    return valid;
}

function CheckWhitelist(email, callback) {
    try {

        fetch('whitelist.json')
            .then(response => response.json())
            .then(json => {
                var found_domain = json.whitelist.find(domain => (email.indexOf(domain) != -1));
                callback(found_domain);
            })
            .catch(error => callback(true)); // Accept the error. Better be safe than sorry
    } catch (error) {
        callback(true);   // Accept the error. Better be safe than sorry
    }
}

var REGISTER_FAILED_MESSAGE = 'Please enter your business email address';

function Register() {
    if (!ValidateInputs()) return;
    var user_email = $('#user_email').val().trim();
    CheckWhitelist(user_email, function (valid) {
        if (valid) {
            var user_name = $('#user_name').val().trim();
            // Render player and chat&utm_name=user_name
            CloseRegDlg();
            var quality = (localStorage.quality ? localStorage.quality : 'Auto');
            SelectQuality(quality);
            RenderChat(user_name);
            // Welcome the user to the show!
            ShowWelcomeMessage(user_name);
            // Sample user name and email
            localStorage.user_name = user_name;
            localStorage.user_email = user_email;
            localStorage.user_valid = 'true';
        }
        else {
            // Prompt user about the failed login attempt
            $('#message').html(REGISTER_FAILED_MESSAGE);
            $('#message').addClass('red');
            $('#user_email').val('');
            $('#user_email').focus();
            localStorage.user_name = '';
            localStorage.user_email = '';
            localStorage.user_valid = 0;
        }
    });
}