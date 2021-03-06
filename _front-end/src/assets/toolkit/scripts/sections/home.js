import config from '../config';
import refreshReviews from '../components/refreshReviews';
import strToBoolean from '../util/strToBoolean';
import kwlog from '../util/kwlog';
import timeago from '../vendor/timeago';
import toastr from '../vendor/toastr';
import im from '../vendor/include-media';

// vendor js configuration
Object.assign($.timeago.settings, config.timeago.settings);
Object.assign($.timeago.settings.strings, config.timeago.strings);

let KW;

function displayMessages() {
  kwlog('messages', KW.messages);
  KW.messages.forEach(({ text, level }) => toastr[level](text));
}

function updateReviewTime($el) {
  const now = Date.now();
  const next = KW.nextReview;
  const noWkVocab = (+next === 0 && +KW.reviewCount < 1);

  kwlog(
    '\nclient date now utc', now,
    '\nreview count', +KW.reviewCount,
    '\nbackend next review local', +next,
    '\nuser has no unlocked vocab', noWkVocab
  );

  if (noWkVocab) {
    // user has no WK vocab
    $el.html('No vocabulary unlocked');
    $el.addClass('hint--top hint--rounded -multiline');
    $el.attr('data-hint', 'You may need to complete some vocabulary lessons on WaniKani or unlock more levels on the Kaniwani vocabulary page!');
  } else if (now > next) {
    // reviews ready!
    refreshReviews();
    clearInterval(KW.reviewTimer);
  } else {
    // update countdown timer
    const countdownText = $.timeago(KW.nextReview);
    $el.html(`Next review: ${countdownText}`);
  }
}

function init() {
  if (im.lessThan('md')) config.toastr.positionClass = 'toast-top-full-width';
  toastr.options = config.toastr;

  // let's update storage KW with any template provided changes
  KW = Object.assign(simpleStorage.get('KW') || {}, window.KW);
  KW.settings = strToBoolean(KW.settings);
  KW.nextReview = Math.ceil(+KW.nextReview);
  KW.nextReviewUTC = Math.ceil(+KW.nextReviewUTC);
  simpleStorage.set('KW', KW);

  // need to get some promises happening instead, too many race conditions
  setTimeout(() => displayMessages(), 1500);

  // are we on home page?
  if (window.location.pathname === '/kw/') {
    let $refreshButton = $("#forceSrs");
    let $reviewButton = $("#reviewCount");

    if (KW.settings.onVacation === false) {
      updateReviewTime($reviewButton);
      KW.reviewTimer = setInterval(() => updateReviewTime($reviewButton), 10000 /* 10s */);
    }

    // event handlers
    $refreshButton.click(() => refreshReviews());
    $reviewButton.click(ev => {
      if ($reviewButton.hasClass('-disabled')) ev.preventDefault();
    });
  }
}


const api = {
  init,
}

export default api;
