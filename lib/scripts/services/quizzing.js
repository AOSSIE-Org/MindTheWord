import {} from '../services/'

export class QuizzingSentence {
  constructor(parentElementID, srcLang, targetLang, $scope) {
    this.parentElementID = parentElementID;
    this.srcLang = srcLang;
    this.targetLang = targetLang;
    this.$scope = $scope;
  }

  setHeads() {
    this.$scope.srcLang = this.srcLang;
    this.$scope.targetLang = this.targetLang;
  }
}