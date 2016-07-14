import refreshReviews from '../components/refreshReviews.js';
import config from '../config';
import im from '../vendor/include-media';
import toastr from '../vendor/toastr';

let CSRF;
let currentLevel;

function init() {
  const $levelList = $('.level-list');

  // vendor js configuration
  if (im.lessThan('md')) config.toastr.positionClass = 'toast-top-full-width';
  toastr.options = config.toastr;

  CSRF = $('#csrf').val();
  currentLevel = simpleStorage.get('KW').user.level;

  if ($levelList.length) {
    // cache selector elements/unchanging vars
    const $levels = $levelList.find('.level-card');
    const $reviewCount = $('.nav-link > .text > .count');

    // Attach events
    $levelList.on('click', '[class*="i-unlock"]', handleLockClick);
    $levelList.on('click', '[class*="i-lock"]', () => {
      notie.alert(3, 'Level is locked. No cheating!', 1);
    });
  }
}

function handleLockClick(event) {
  event.preventDefault();

  const $icon = $(this);
  const $card = $icon.closest('.level-card');
  const level = $card.data('level-id');

  if ($card.hasClass('-unlocked')) {
    notie.confirm(`Are you sure you want to relock level ${level}?
      </br>This will reset the SRS for all items in this level.`,
      'Yeah!',
      'Nope',
      () => reLockLevel($card, $icon, level)
    );
  } else {
    unLockLevel($card, $icon, level);
  }
}

function unLockLevel($card, $icon, level) {
  $icon.removeClass('i-unlock i-unlocked').addClass('-loading');

  $.post('/kw/levelunlock/', { level, csrfmiddlewaretoken: CSRF })
    .done(res => {
      toastr.success(res);
      // notie.alert(1, res, 8);

      $icon.removeClass('-loading').addClass('i-unlocked').attr('title', 'Relock');
      $card.removeClass('-locked -unlockable');
      $card.addClass('-unlocked');
      $card.find('.i-link').removeClass('-hidden');

      refreshReviews({ forceGet: true });
      simpleStorage.set('recentlyRefreshed', true, { TTL: 5000 });
    })
   .fail(res => handleAjaxFail(res, level, 'unlock'));
}

function reLockLevel($card, $icon, level) {
  $icon.removeClass('i-unlock i-unlocked').addClass('-loading');

  $.post('/kw/levellock/', { level, csrfmiddlewaretoken: CSRF })
    .done(res => {
      const currentLevelMsg = `<br/> We noticed that you just locked your current level. <br/>
      Newly unlocked vocab on WaniKani will no longer be added to your reviews.<br/>
      You can toggle <b>Follow WaniKani</b> back on in the
      <a href="/kw/settings"><b>Settings page</b></a>.`;

      if (level === currentLevel) res += currentLevelMsg;

      toastr.success(res);
      // notie.alert(1, res, 20);

      $icon.removeClass('-loading').addClass('i-unlock').attr('title', 'Unlock');
      $card.removeClass('-unlocked');
      $card.addClass('-locked -unlockable');
      $card.find('.i-link').addClass('-hidden');

      refreshReviews({ forceGet: true });
      simpleStorage.set('recentlyRefreshed', true, { TTL: 5000 });
    })
   .fail(res => handleAjaxFail(res, level, 'lock'));
}

function handleAjaxFail(res, level, action, user) {
  const message = `Something went wrong - please try again.
    If the problem persists, submit a bug report via <a href="/contact"> the contact form</a>
    with the following information:
    <q class="failresponse">${res.status}: ${res.statusText}
    while trying to ${action} level ${level}.</q>`;

  notie.alert(3, message, 60);
}

const api = {
  init,
};

export default api;
