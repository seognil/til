# Q: What is the hex of 1.414 double

What's IEEE754: <https://en.wikipedia.org/wiki/IEEE_754>

Steps tear down: <https://binary-system.base-conversion.ro/convert-real-numbers-from-decimal-system-to-64bit-double-precision-IEEE754-binary-floating-point.php>

Online converter: <https://www.binaryconvert.com/result_double.html?decimal=049046052049052>

## python

<https://stackoverflow.com/questions/23624212/how-to-convert-a-float-into-hex/38879403>

```py
import struct


def float_to_hex(f):
    return hex(struct.unpack("<I", struct.pack("<f", f))[0])


def double_to_hex(f):
    return hex(struct.unpack("<Q", struct.pack("<d", f))[0])


print(float_to_hex(1.414))  # 0x3fb4fdf4
print(double_to_hex(1.414))  # 0x3ff69fbe76c8b439
```
