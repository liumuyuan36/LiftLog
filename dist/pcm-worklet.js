class CapturePCM extends AudioWorkletProcessor{
 constructor(){super();this.buffer=new Float32Array(2048);this.offset=0;this.port.onmessage=e=>{if(e.data==='flush'){if(this.offset)this.port.postMessage({samples:this.buffer.slice(0,this.offset)});this.offset=0;this.port.postMessage({flushed:true});}};}
 process(inputs,outputs){for(const channel of outputs[0]??[])channel.fill(0);const input=inputs[0]?.[0];if(input)for(const value of input){this.buffer[this.offset++]=value;if(this.offset===this.buffer.length){this.port.postMessage({samples:this.buffer.slice()});this.offset=0;}}return true;}
}
registerProcessor('liftlog-pcm',CapturePCM);
