/// <reference path="../../../node_modules/d3-node-editor/src/index.d.ts"/>
import { Component, AfterViewInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'd3ne',
    template: '<div class="wrapper"><div #d3neEditor class="node-editor"></div></div>',
    styleUrls: ['./d3ne.component.css', '../../../node_modules/d3-node-editor/build/d3-node-editor.css'],
    encapsulation: ViewEncapsulation.None
})

export class D3NEComponent implements AfterViewInit{

    @ViewChild('d3neEditor') el: ElementRef;
 
    ngAfterViewInit() {
        var numSocket = new D3NE.Socket("number", "Number value", "hint");

        var componentNum = new D3NE.Component("Number", {
           builder(node) {
              var out1 = new D3NE.Output("Number", numSocket);
              var numControl = new D3NE.Control('<input type="number">',
                 (el: HTMLInputElement, c: any) => {
                    el.value = c.getData('num') || 1;
                 
                    function upd() {
                       c.putData("num", parseFloat(el.value));
                    }
        
                    el.addEventListener("input", ()=>{
                       upd();
                       editor.eventListener.trigger("change");
                    });
                    el.addEventListener("mousedown", function(e){e.stopPropagation()});// prevent node movement when selecting text in the input field
                   upd();
                 }
              );
        
              return node.addControl(numControl).addOutput(out1);
           },
           worker(node, inputs, outputs) {
              outputs[0] = node.data.num;
           }
        });
        
        var componentAdd = new D3NE.Component("Add", {
           builder(node) {
              var inp1 = new D3NE.Input("Number", numSocket);
              var inp2 = new D3NE.Input("Number", numSocket);
              var out = new D3NE.Output("Number", numSocket);
        
              var numControl = new D3NE.Control(
                 '<input readonly type="number">',
                 (el: HTMLInputElement, control:any) => {
                    control.setValue = val => {
                       el.value = val;
                    };
                 }
              );
        
              return node
                 .addInput(inp1)
                 .addInput(inp2)
                 .addControl(numControl)
                 .addOutput(out);
           },
           worker(node, inputs, outputs) {
              var sum = inputs[0][0] + inputs[1][0];
              (<any>editor.nodes.find(n => n.id == node.id).controls[0]).setValue(sum);
              outputs[0] = sum;
           }
        });
        
        var menu = new D3NE.ContextMenu({
           Values: {
              Value: componentNum,
              Action: function() {
                 alert("ok");
              }
           },
           Add: componentAdd
        });
        
        var container = this.el.nativeElement;
    
        var components = [componentNum, componentAdd];
        var editor = new D3NE.NodeEditor("demo@0.1.0", container, components, menu);
        
        var nn = componentNum.newNode();
        nn.data.num = 2;
        var n1 = componentNum.builder(nn);
        var n2 = componentNum.builder(componentNum.newNode());
        var add = componentAdd.builder(componentAdd.newNode());
        
        n1.position = [80, 200];
        n2.position = [80, 400];
        add.position = [500, 240];


        editor.connect(n1.outputs[0], add.inputs[0]);
        editor.connect(n2.outputs[0], add.inputs[1]);
        
        editor.addNode(n1);
        editor.addNode(n2);
        editor.addNode(add);
        //  editor.selectNode(tnode);
        
        var engine = new D3NE.Engine("demo@0.1.0", components);
        
        editor.eventListener.on("change", async function() {
           await engine.abort();
           await engine.process(editor.toJSON());
        });
        
        editor.view.zoomAt(editor.nodes);
        editor.eventListener.trigger("change");
        editor.view.resize();
        
}
        
}