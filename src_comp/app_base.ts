// Drag & Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}


// abstract class Component {

//   constructor(
//   ) {
//   }

// }





// autobind decoretor
function autobind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const acjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return acjDescriptor;
}

function validate() {
}




class ProjectState {
  constructor() {  }
}





class ProjectInput {
  baseElements: any;
  outputElements: any;
  editElements: any;

  constructor() {
  }

  configure() {  }

  renderContent() {}
  attach() {}
}





class ProjectList {

  constructor() {
  }

  renderContent() {  }

  configure() {  }

  attach() {  }
}




class ProjectItem {

  constructor() {  }

  configure() {  }

  renderContent() {  }

  attach() {  }

}




const prjState = new ProjectState();
const actvPrjList = new ProjectList();
const finsPrjList = new ProjectList();
const prjInput = new ProjectInput();
