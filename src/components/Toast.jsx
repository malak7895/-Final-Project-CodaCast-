import { Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Toast() {
const {toast}=useStore();return toast?<div className="toast"><Check size={17}/>{toast}</div>:null}
