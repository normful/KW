import refreshReviews from '../components/refreshReviews.js';

let CSRF,
    user,
    $reviewCount,
    $levelList,
    $levels,
    $icon,
    $card,
    level,
    currentLevel;

function init() {
  $levelList = $('.level-list');

  $('#unlockAll').click(unlockAll);

  // if container element exists on current page
  if($levelList.length) {

    // cache selector elements/unchanging vars
    CSRF = $('#csrf').val();
    currentLevel = simpleStorage.get('KW').user.level;
    $levels = $levelList.find('.level-card');
    $reviewCount = $('.nav-link > .text > .count')

    // Attach events
    $levelList.on('click', '[class*="i-unlock"]', handleLockClick);
    $levelList.on('click', '[class*="i-lock"]', () => notie.alert(3, 'Level is locked. No cheating!', 1));
  }
}

function handleLockClick(ev) {
  ev.preventDefault();

  $icon = $(this);
  $card = $icon.closest(".level-card");
  level = $card.data("level-id");

  if ($card.hasClass('-unlocked')) {
    notie.confirm(`Are you sure you want to relock level ${level}?
      </br>This will reset the SRS for all items in this level.`, 'Yeah!', 'Nope', reLockLevel);
  } else {
    unLockLevel();
  }
}

function unlockAll(ev) {
  console.log('unlocking all');

  $.post("/kw/unlockall/", { csrfmiddlewaretoken: CSRF })
    .done(res => {
      notie.alert(1, res, 8);
      refreshReviews({ forceGet: true });
      simpleStorage.set('recentlyRefreshed', true, {TTL: 30000});
    })
   .fail(res => handleAjaxFail(res, 'all', 'unlock'));
}

function unLockLevel() {
  $icon.removeClass("i-unlock i-unlocked").addClass('-loading');

  $.post("/kw/levelunlock/", {level: level, csrfmiddlewaretoken: CSRF})
    .done(res => {
      notie.alert(1, res, 8);

      $icon.removeClass("-loading").addClass('i-unlocked').attr('title', 'Relock');
      $card.removeClass("-locked -unlockable");
      $card.addClass("-unlocked");
      $card.find('.i-link').removeClass('-hidden');

      refreshReviews({forceGet:true});
      simpleStorage.set('recentlyRefreshed', true, {TTL: 5000});
    })
   .fail(res => handleAjaxFail(res, level, 'unlock'));
}

function reLockLevel() {
  $icon.removeClass("i-unlock i-unlocked").addClass('-loading');

  $.post("/kw/levellock/", {level: level, csrfmiddlewaretoken: CSRF})
    .done(res => {

      let currentLevelMsg = `<br/> We noticed that you just locked your current level. <br/>Newly unlocked vocab on WaniKani will no longer be added to your reviews.<br/> You can toggle <b>Follow WaniKani</b> back on in the <a href="/kw/settings"><b>Settings page</b></a>.`;

      if (level === currentLevel) res += currentLevelMsg;

      notie.alert(1, res, 20);

      $icon.removeClass("-loading").addClass("i-unlock").attr('title', 'Unlock');
      $card.removeClass("-unlocked");
      $card.addClass("-locked -unlockable");
      $card.find('.i-link').addClass('-hidden');

      refreshReviews({forceGet:true});
      simpleStorage.set('recentlyRefreshed', true, {TTL: 5000});
    })
   .fail(res => handleAjaxFail(res, level, 'lock'));
}

function handleAjaxFail(res, level, action, user) {
  let message = `Something went wrong - please try again. If the problem persists, submit a bug report via <a href="/contact"> the contact form</a> with the following information: <q class="failresponse">${res.status}: ${res.statusText} while trying to ${action} level ${level}.</q>`;

  notie.alert(3, message, 60);
}

const api = {
  init: init
};

export default api;
