/** User-visible storage copy derives from the same pairing state as sync. */
export function storageGuide(status={}, {online=globalThis.navigator?.onLine!==false}={}) {
  const shared='학습 기록, 마을·보상 기록과 설정한 장소 이름';
  if(!status.paired) return {
    title:'기록은 이 기기에 저장',
    place:'장소 이름은 이 기기에 저장해 이야기 속에 넣습니다. 가족 기기를 연결하면 장소 이름도 다른 연결 기기와 공유됩니다.',
    records:'아이별 기록은 현재 기기·브라우저에 따로 저장합니다. 가족 기기를 연결하기 전에는 다른 기기와 자동으로 합치지 않습니다.',
    sync:'가족 기기를 연결하면 기록을 이어서 사용할 수 있어요.'
  };
  const unavailable=status.secureContext===false;
  const pending=(status.responseHistory?.pending||0)>0||status.responseHistory?.deliveryPending||Boolean(status.responseHistory?.deliveryError||status.responseHistory?.error);
  const sync=unavailable?'가족 연결은 설정되어 있지만 현재 주소에서는 동기화할 수 없어요. HTTPS 주소에서 다시 확인해 주세요.'
    :!online?'지금은 오프라인이에요. 이 기기에 기록하며, 인터넷에 다시 연결되면 가족 기록과 합쳐요.'
    :pending?'이 기기에 저장한 기록 중 가족 공간으로 전송을 기다리는 기록이 있어요. 아래 동기화 상태를 확인해 주세요.'
    :'이 기기는 연결된 가족 공간과 기록을 자동으로 합쳐요.';
  return {
    title:'기기에 저장하고 가족 기록과 동기화',
    place:'장소 이름은 이 기기에 저장해 이야기 속에 넣으며, 연결된 가족 기기와 동기화합니다.',
    records:'아이별 기록을 이 기기에 따로 보관하고, '+shared+'을 연결된 가족 기기와 합칩니다. '+sync+' 기기 연결 해제는 이후 동기화를 멈추며, 이미 저장된 기기·가족 기록을 삭제하지 않습니다.',
    sync
  };
}
